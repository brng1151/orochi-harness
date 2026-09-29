import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { sessionFormatCatalog } from '@orochi-network/oh-session-format-catalog'
import { sessionFormatLogFilename } from '@orochi-network/oh-session-format'
import { packPreviewFixture } from '../src/preview.ts'
import { packVfsOverlay } from '../src/pack.ts'

const roots: string[] = []
const currentVersion = sessionFormatCatalog.currentVersion
const text = (bytes: Uint8Array | undefined): string => new TextDecoder().decode(bytes)

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function source() {
  const root = mkdtempSync(join(tmpdir(), 'oh-preview-source-'))
  roots.push(root)
  const session = join(root, 'sessions', 'project', 'example')
  mkdirSync(session, { recursive: true })
  return {
    trees: [{ mount: 'home', directory: root }],
    put(version: number, body = '', overrides: Record<string, unknown> = {}) {
      const path = join(session, sessionFormatLogFilename(version))
      const header = { type: 'session', version, id: 'example', createdAt: 1, isSeeded: false, delegationDepth: 0, ...overrides }
      writeFileSync(path, JSON.stringify(header) + '\n' + body)
      return path
    },
  }
}

describe('Node preparation of Preview Session data', () => {
  it('uses the highest generation and leaves an already-current image byte-identical', () => {
    const fixture = source()
    const older = fixture.put(3, '{invalid historical data}\n')
    fixture.put(currentVersion)
    const original = packVfsOverlay(fixture.trees)
    expect(packPreviewFixture(fixture.trees).image).toEqual(original.image)
    expect(text(original.files['home/sessions/project/example/session.v3.jsonl'])).toBe(readFileSync(older, 'utf8'))
  })

  it('keeps an overlay without Sessions opaque', () => {
    const fixture = source()
    expect(packPreviewFixture(fixture.trees)).toEqual(packVfsOverlay(fixture.trees))
  })

  it.each(['future', 'corrupt', 'unknown-required'] as const)('refuses selected %s data without falling back or changing inputs', (mode) => {
    const fixture = source()
    fixture.put(3)
    const path = fixture.put(mode === 'future' ? currentVersion + 1 : currentVersion,
      mode === 'corrupt' ? '{invalid JSON}\n'
        : mode === 'unknown-required' ? JSON.stringify({ type: 'external/required', seq: 0, time: 1, data: null }) + '\n' : '')
    const before = readFileSync(path)
    expect(() => packPreviewFixture(fixture.trees)).toThrow()
    expect(readFileSync(path)).toEqual(before)
  })

  it.each([{ version: 2 }, { id: 'other' }])('refuses selected metadata that disagrees with its location: %j', (overrides) => {
    const fixture = source()
    fixture.put(3, '', overrides)
    expect(() => packPreviewFixture(fixture.trees)).toThrow('disagrees with its Session header')
  })

  it('refuses a torn physical tail and compressed Session generations', () => {
    const fixture = source()
    const path = fixture.put(3)
    const bytes = readFileSync(path)
    writeFileSync(path, bytes.subarray(0, -1))
    expect(() => packPreviewFixture(fixture.trees)).toThrow('torn physical tail')
    writeFileSync(path, bytes)
    writeFileSync(join(dirname(path), sessionFormatLogFilename(currentVersion) + '.zstd'), 'compressed data')
    expect(() => packPreviewFixture(fixture.trees)).toThrow('canonical raw Session generation')
  })
})
