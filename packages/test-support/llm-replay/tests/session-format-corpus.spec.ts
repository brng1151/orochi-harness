import { readFileSync, readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SESSION_FORMAT_VERSION } from '@orochi-network/oh-session'
import { SessionFormatUnsupportedMigrationError } from '@orochi-network/oh-session-format-catalog'
import { unversionedProtocolFixtures } from './session-format-corpus-inventory.ts'
import { parseSessionLog } from '../src/index.ts'

const repoRoot = resolve(import.meta.dirname, '../../../..')
const excludedDirectories = new Set(['dist', 'lib', 'node_modules'])

function committedSessionFixtures(directory: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      if (!excludedDirectories.has(entry.name)) files.push(...committedSessionFixtures(path))
    } else if (entry.name.startsWith('session') && entry.name.endsWith('.jsonl')) {
      if (!/^session(?:\.[1-9]\d*)?(?:\.v[1-9]\d*)?\.jsonl$/.test(entry.name)) {
        throw new Error(`invalid committed Session filename: ${path}`)
      }
      files.push(path)
    }
  }
  return files
}

function declaresFormat(text: string): boolean {
  const firstLine = text.split(/\r?\n/).find(line => line.trim().length > 0)
  if (firstLine === undefined) return false
  const header: unknown = JSON.parse(firstLine)
  return header !== null && typeof header === 'object' && !Array.isArray(header)
    && Object.hasOwn(header, 'version')
}

function filenameFormatVersion(path: string): number {
  const match = /^session(?:\.[1-9]\d*)?(?:\.v([1-9]\d*))?\.jsonl$/.exec(path.split(/[/\\]/u).at(-1) ?? '')
  if (match === null) throw new Error(`invalid committed Session filename: ${path}`)
  return match[1] === undefined ? 0 : Number(match[1])
}

/** The one refusal this build offers for a stored artifact naming any other generation. */
function uniformRefusal(sourceVersion: number): string {
  return `session snapshot line 1: stored Session uses format v${sourceVersion}; this build reads and writes only v${SESSION_FORMAT_VERSION}`
}

/**
 * Require one stored artifact to behave like its declared generation: the
 * current writer restores, and any other stored generation is refused before
 * its events parse with the exact uniform message.
 */
function assertRestoration(
  key: string,
  sourceVersion: number,
  restore: () => unknown,
): void {
  if (sourceVersion === SESSION_FORMAT_VERSION) {
    expect(restore, key + ': current-format restoration').not.toThrow()
    return
  }
  let refusal: unknown
  try {
    restore()
  } catch (error) {
    refusal = error
  }
  expect(refusal, key + ': non-current generation must be refused')
    .toBeInstanceOf(SessionFormatUnsupportedMigrationError)
  expect((refusal as Error).message, key + ': uniform single-generation refusal')
    .toBe(uniformRefusal(sourceVersion))
}

const fixtures = ['snapshots', 'packages', 'scripts/snapshots/python-sdk-single-exe']
  .flatMap(root => committedSessionFixtures(join(repoRoot, root)))
  .map(file => ({ file, key: relative(repoRoot, file).split('\\').join('/') }))
  .sort((a, b) => a.key.localeCompare(b.key))

describe('committed Session format corpus', () => {
  it('keeps every protocol-fixture exception tied to an existing fixture', () => {
    const keys = new Set(fixtures.map(({ key }) => key))
    for (const key of unversionedProtocolFixtures) {
      expect(keys.has(key), key).toBe(true)
    }
  })

  it.each(fixtures)('$key', ({ file, key }) => {
    const bytes = readFileSync(file)
    const source = bytes.toString('utf8')
    try {
      if (unversionedProtocolFixtures.has(key)) {
        expect(declaresFormat(source), key + ': protocol fixture must remain unversioned').toBe(false)
        expect(filenameFormatVersion(file), key + ': protocol fixture filename').toBe(0)
        return
      }
      expect(declaresFormat(source), key + ': Session header must declare its format').toBe(true)
      const header = JSON.parse(source.split(/\r?\n/u).find(line => line.trim().length > 0) ?? '{}') as {
        version: number
      }
      expect(header.version, key + ': filename/header Session generation').toBe(filenameFormatVersion(file))
      assertRestoration(key, header.version, () => parseSessionLog(source))
    } finally {
      expect(readFileSync(file), key + ': source bytes remain unchanged').toEqual(bytes)
    }
  })
})

describe('corpus unsupported policy', () => {
  const refused = (sourceVersion: number): never => {
    throw new SessionFormatUnsupportedMigrationError(uniformRefusal(sourceVersion))
  }

  it('rejects a current-generation fixture that fails restoration', () => {
    expect(() => { assertRestoration('current', SESSION_FORMAT_VERSION, () => { throw new Error('corrupt') }) })
      .toThrow('current-format restoration')
  })

  it('rejects a non-current fixture that restores', () => {
    expect(() => { assertRestoration('historical', 2, () => []) }).toThrow('non-current generation must be refused')
  })

  it('rejects corruption masquerading as a refusal', () => {
    expect(() => { assertRestoration('corrupt', 2, () => { throw new Error(uniformRefusal(2)) }) })
      .toThrow('non-current generation must be refused')
  })

  it('rejects a refusal that does not name the stored generation', () => {
    expect(() => { assertRestoration('changed', 2, () => refused(3)) }).toThrow('uniform single-generation refusal')
  })

  it('accepts only the exact typed uniform refusal', () => {
    expect(() => { assertRestoration('historical', 2, () => refused(2)) }).not.toThrow()
  })

  it('never exempts a current-generation fixture', () => {
    expect(() => {
      assertRestoration('current', SESSION_FORMAT_VERSION, () => refused(SESSION_FORMAT_VERSION))
    }).toThrow('current-format restoration')
  })
})
