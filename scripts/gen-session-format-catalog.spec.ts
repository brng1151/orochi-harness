import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  readCurrentSessionFormatVersion,
  renderSessionFormatCatalog,
} from './gen-session-format-catalog.ts'

const fixtureRoots: string[] = []

afterEach(() => {
  for (const root of fixtureRoots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function fixtureRoot(declared: string): string {
  const root = mkdtempSync(join(tmpdir(), 'oh-session-format-catalog-'))
  fixtureRoots.push(root)
  mkdirSync(join(root, 'packages/core/session/src'), { recursive: true })
  writeFileSync(join(root, 'packages/core/session/src/types.ts'), `export const SESSION_FORMAT_VERSION = ${declared}\n`)
  return root
}

describe('readCurrentSessionFormatVersion', () => {
  it('reads the writer constant from the core Session source', () => {
    expect(readCurrentSessionFormatVersion(fixtureRoot('5'))).toBe(5)
  })

  it('refuses a checkout without a writer constant', () => {
    const root = fixtureRoot('5')
    writeFileSync(join(root, 'packages/core/session/src/types.ts'), 'export const OTHER = 5\n')
    expect(() => readCurrentSessionFormatVersion(root)).toThrow('cannot read SESSION_FORMAT_VERSION')
  })
})

describe('renderSessionFormatCatalog', () => {
  it('declares exactly one codec and no migrations', () => {
    const rendered = renderSessionFormatCatalog(5)
    expect(rendered).toContain('currentVersion: 5,')
    expect(rendered).toContain('codec: sessionFormatV5Codec,')
    expect(rendered).not.toContain('migrations:')
    expect(rendered.match(/^\s*import .* from '@orochi-network\/oh-session-format-v/mu)).toBeNull()
  })

  it('is deterministic for one writer version', () => {
    expect(renderSessionFormatCatalog(5)).toBe(renderSessionFormatCatalog(5))
  })

  it('differs when the writer version advances', () => {
    expect(renderSessionFormatCatalog(6)).not.toBe(renderSessionFormatCatalog(5))
  })
})
