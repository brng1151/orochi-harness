/** Canonical event-layout projection helpers for repository session fixtures. */

import { deepStrictEqual } from 'node:assert'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { decodeSeqRanges, type SessionEvent } from '@orochi-network/oh-session'
import { sessionFormatCatalog } from '@orochi-network/oh-session-format-catalog'

/** Physical persistence artifacts validated by the WebWorker runtime fixture spec. */
const WEBWORKER_PHYSICAL_SESSION_FIXTURE_ROOT =
  'packages/experimental/webworker-runtime/tests/fixtures/vfs-example/home/sessions/'

/** Installed-runtime snapshots that preserve the JSONL writer's physical encoding. */
const PYTHON_RUNTIME_PHYSICAL_SESSION_FIXTURE_ROOT =
  'scripts/snapshots/python-sdk-single-exe/'

/** One repository session fixture and its canonical projected representation. */
export interface SessionFixtureLayout {
  /** Repository-relative path with `/` separators. */
  path: string
  /** Current fixture bytes decoded as UTF-8. */
  source: string
  /** Canonical projected fixture bytes. */
  canonical: string
}

/**
 * Whether a repository JSONL preserves physical persistence encoding rather
 * than the logical event projection owned by this script.
 * @param path - Repository-relative path with `/` separators.
 * @returns True for physical WebWorker and installed-runtime session logs.
 */
export function isPhysicalSessionFixture(path: string): boolean {
  if (path.startsWith(WEBWORKER_PHYSICAL_SESSION_FIXTURE_ROOT)) {
    return /\/session(?:\.v[1-9]\d*)?\.jsonl$/.test(path)
  }
  return path.startsWith(PYTHON_RUNTIME_PHYSICAL_SESSION_FIXTURE_ROOT)
    && /\/session(?:\.[1-9]\d*)?(?:\.v[1-9]\d*)?\.jsonl$/.test(path)
}

function isSessionHeader(value: unknown): boolean {
  return value !== null && typeof value === 'object' && (value as { type?: unknown }).type === 'session'
}

function sessionHeader(content: string): { line: string; value: Record<string, unknown> } | undefined {
  const line = content.split(/\r?\n/).find(candidate => candidate.trim().length > 0)
  if (line === undefined) return undefined
  let value: unknown
  try {
    value = JSON.parse(line)
  } catch {
    return undefined
  }
  return isSessionHeader(value) ? { line, value: value as Record<string, unknown> } : undefined
}

/** Whether a session header names a stored generation this build does not read. */
function namesStoredGeneration(header: Record<string, unknown>): boolean {
  return Object.hasOwn(header, 'version') && header.version !== sessionFormatCatalog.currentVersion
}

function renderFixture(headerLine: string, events: readonly SessionEvent[]): string {
  return [
    headerLine,
    ...events.map((event) => {
      const record: Record<string, unknown> = { ...event }
      delete record.seq
      delete record.time
      return JSON.stringify(record)
    }),
    '',
  ].join('\n')
}

function parseFixtureObjectLine(line: string, lineNumber: number): Record<string, unknown> {
  let value: unknown
  try {
    value = JSON.parse(line)
  } catch (error) {
    throw new Error(`session snapshot line ${lineNumber} contains invalid JSON`, { cause: error })
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`session snapshot line ${lineNumber} must be a JSON object`)
  }
  return value as Record<string, unknown>
}

function parseFixtureRows(content: string): SessionEvent[] {
  const rows: Record<string, unknown>[] = []
  const rowLines: number[] = []
  let headerSkipped = false
  for (const [index, line] of content.split(/\r?\n/).entries()) {
    if (line.trim().length === 0) continue
    if (!headerSkipped) {
      headerSkipped = true
      continue
    }
    rows.push(parseFixtureObjectLine(line, index + 1))
    rowLines.push(index + 1)
  }
  // Current snapshots may contain owner-restored scrub tokens such as
  // `{{tools}}`; semantic replay restores those sidecars, while this layout
  // gate owns only envelopes, source-event ranges, and one-event-per-row form.
  return rows.map((source, index) => {
    const record = { ...source }
    try {
      if (record.type === 'text-chunks'
        || record.type === 'reasoning-chunks'
        || record.type === 'tool-call-chunks') {
        throw new Error('current projected fixtures cannot contain legacy packed rows')
      }
      if (Object.hasOwn(record, 'sourceEventSeqs')) {
        record.sourceEventSeqs = decodeSeqRanges(record.sourceEventSeqs)
      }
      return record as unknown as SessionEvent
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      throw new Error(`session snapshot line ${rowLines[index] ?? 1}: ${detail}`, { cause: error })
    }
  })
}

function withoutEnvelope(events: readonly SessionEvent[]): Array<Omit<SessionEvent, 'seq' | 'time'>> {
  return events.map((event) => {
    const { seq: _seq, time: _time, ...projected } = event
    return projected
  })
}

/**
 * Canonicalize one JSONL document when its first record is a session header.
 * A stored header naming another generation is refused before its body is read.
 * Current and versionless body records re-encode one event per row and omit
 * storage sequence/time envelopes; their header is preserved verbatim.
 * Non-session JSONL returns undefined.
 *
 * @param content - JSONL source text.
 * @param label - path-like diagnostic label.
 * @returns Canonical text for a session fixture, otherwise undefined.
 */
export function canonicalSessionFixture(content: string, label = '<session-fixture>'): string | undefined {
  const header = sessionHeader(content)
  if (header === undefined) return undefined
  if (namesStoredGeneration(header.value)) {
    throw new Error(
      `${label}: session snapshot line 1: this build reads and writes only format v${sessionFormatCatalog.currentVersion}, `
      + `not v${String(header.value.version)}`,
    )
  }

  let events
  try {
    events = parseFixtureRows(content)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`${label}: ${detail}`, { cause: error })
  }
  const canonical = renderFixture(header.line, events)
  const decoded = parseFixtureRows(canonical)
  try {
    deepStrictEqual(withoutEnvelope(decoded), withoutEnvelope(events))
  } catch (error) {
    throw new Error(`${label}: packed snapshot rewrite changed the event payload stream`, { cause: error })
  }
  if (renderFixture(header.line, decoded) !== canonical) {
    throw new Error(`${label}: packed rewrite is not idempotent`)
  }
  return canonical
}

/**
 * Discover tracked and unignored untracked JSONL files through Git.
 *
 * @param root - repository root.
 * @returns Stable repository-relative paths.
 */
function discoverJsonlFiles(root: string): string[] {
  return execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', '*.jsonl'],
    { cwd: root, encoding: 'utf8' },
  ).split('\0')
    .filter(path => path.length > 0 && existsSync(resolve(root, path)))
    .sort()
}

/**
 * Inspect repository JSONL session fixtures this build reads. Physical
 * persistence artifacts and stored artifacts naming another generation stay
 * untouched and unvalidated.
 *
 * @param root - repository root.
 * @returns Session fixtures with current and canonical text.
 */
export function inspectSessionFixtureLayouts(root: string): SessionFixtureLayout[] {
  return discoverJsonlFiles(root).flatMap((path) => {
    if (isPhysicalSessionFixture(path)) return []
    const source = readFileSync(resolve(root, path), 'utf8')
    const header = sessionHeader(source)
    if (header === undefined || namesStoredGeneration(header.value)) return []
    const canonical = canonicalSessionFixture(source, path)
    return canonical === undefined ? [] : [{ path, source, canonical }]
  })
}
