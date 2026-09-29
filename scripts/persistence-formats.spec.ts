/** The format reference covers the one installed writer generation and refuses leftovers. */

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { loadPersistenceFormats, runPersistenceFormats } from './persistence-formats.ts'
import { canonicalizeSchema, schemaDigest } from './persistence-schema-model.ts'
import type { PersistenceRoot, PersistenceSchemaInventory, PersistenceType, SchemaNode } from './persistence-schema-model.ts'

function rootSchema(metadata: Omit<PersistenceRoot, 'schema' | 'digest'>, nodes: readonly SchemaNode[]): PersistenceRoot {
  const schema = canonicalizeSchema(nodes, 0)
  return { ...metadata, schema, digest: schemaDigest(schema) }
}

function completeInventory(roots: readonly PersistenceRoot[]): PersistenceSchemaInventory {
  const types = new Map<string, PersistenceType>()
  for (const root of roots) {
    root.schema.nodes.forEach((_, index) => {
      const schema = canonicalizeSchema(root.schema.nodes, index)
      const digest = schemaDigest(schema)
      types.set(digest, { digest, schema, names: [], sources: [] })
    })
  }
  return { formatVersion: 1, roots, types: [...types.values()] }
}

function inventory(version: number): PersistenceSchemaInventory {
  return completeInventory([
    rootSchema({ key: 'SessionHeader', kind: 'header' }, [
      { kind: 'object', indices: [], properties: [{ name: 'version', type: 1, optional: false }] },
      { kind: 'literal', value: version },
    ]),
    rootSchema({ key: 'JsonlHeaderLine', kind: 'header' }, [
      { kind: 'object', indices: [], properties: [{ name: 'version', type: 1, optional: false }] },
      { kind: 'primitive', type: 'number' },
    ]),
    rootSchema({ key: 'SessionEventEnvelope', kind: 'envelope' }, [{ kind: 'object', indices: [], properties: [] }]),
    rootSchema({ key: 'event:example/value', kind: 'event', event: 'example/value', surface: false }, [
      { kind: 'object', indices: [], properties: [{ name: 'type', type: 1, optional: false }, { name: 'data', type: 2, optional: false }] },
      { kind: 'literal', value: 'example/value' }, { kind: 'primitive', type: 'string' },
    ]),
  ])
}

function write(root: string, path: string, content: string): void {
  writeFileSync(join(root, path), content)
}

const temporary: string[] = []
afterEach(() => {
  for (const root of temporary.splice(0)) rmSync(root, { recursive: true, force: true, maxRetries: 3 })
})

function fixture(currentVersion = 5): string {
  const root = mkdtempSync(join(tmpdir(), 'oh-persistence-formats-'))
  temporary.push(root)
  mkdirSync(join(root, 'packages/core/session/src'), { recursive: true })
  mkdirSync(join(root, 'docs/persistence-changes'), { recursive: true })
  write(root, 'packages/core/session/src/types.ts', `export const SESSION_FORMAT_VERSION = ${currentVersion} as const\n`)
  const snapshot = inventory(currentVersion)
  write(root, 'docs/persistence-schema.json', JSON.stringify(snapshot))
  const catalog = [
    `# Session format v${currentVersion}`,
    '',
    '[Inventory](persistence-schema.json)',
    '',
    '| Root | Kind | SHA-256 |',
    '|---|---|---|',
    ...snapshot.roots.map(entry => `| \`${entry.key}\` | ${entry.kind} | \`${entry.digest}\` |`),
    '',
  ]
  for (const suffix of ['.md', '.zh.md']) write(root, `docs/persistence-catalog${suffix}`, catalog.join('\n'))
  for (const suffix of ['.md', '.zh.md']) {
    const switcher = suffix === '.md' ? 'English | [中文](README.zh.md)' : '[English](README.md) | 中文'
    write(root, `docs/persistence-changes/README${suffix}`, [
      '# Persistence type changes',
      '',
      switcher,
      '',
      '<!-- persistence-format-index:start -->',
      '',
      'Pending formats.',
      '',
      '<!-- persistence-format-index:end -->',
      '',
    ].join('\n'))
  }
  return root
}

describe('loadPersistenceFormats', () => {
  it('loads the one installed reference from the generated catalog', () => {
    const formats = loadPersistenceFormats(fixture())
    expect(formats.currentVersion).toBe(5)
    expect(formats.entries).toHaveLength(1)
    expect(formats.entries[0]).toMatchObject({
      version: 5,
      document: 'docs/persistence-catalog.md',
      schemaPath: 'docs/persistence-schema.json',
    })
    expect(formats.entries[0]?.inventory.roots).toHaveLength(4)
  })

  it('refuses a leftover historical reference this build cannot read', () => {
    const root = fixture()
    mkdirSync(join(root, 'docs/persistence-changes/historical-formats'), { recursive: true })
    write(root, 'docs/persistence-changes/historical-formats/v3.md', '# v3\n')
    expect(() => loadPersistenceFormats(root))
      .toThrow('unexpected persistence format artifact v3.md: this build reads and writes only v5')
  })

  it('refuses a missing generated schema', () => {
    const root = fixture()
    rmSync(join(root, 'docs/persistence-schema.json'))
    expect(() => loadPersistenceFormats(root)).toThrow('missing persistence format artifact docs/persistence-schema.json')
  })

  it('refuses a catalog that omits a root index entry', () => {
    const root = fixture()
    const path = join(root, 'docs/persistence-catalog.md')
    write(root, 'docs/persistence-catalog.md', readFileSync(path, 'utf8').replace(/^\| `SessionHeader`.*\n/mu, ''))
    expect(() => loadPersistenceFormats(root)).toThrow('missing schema index entry for SessionHeader')
  })

  it('refuses a catalog that omits the schema link', () => {
    const root = fixture()
    const path = join(root, 'docs/persistence-catalog.md')
    write(root, 'docs/persistence-catalog.md', readFileSync(path, 'utf8').replace('[Inventory](persistence-schema.json)', 'Inventory'))
    expect(() => loadPersistenceFormats(root)).toThrow('missing link to persistence-schema.json')
  })
})

describe('runPersistenceFormats', () => {
  it('reports the installed version and accepts a refreshed index', () => {
    const root = fixture()
    expect(runPersistenceFormats(['--root', root, '--write'])).toContain('Persistence formats: v5 verified')
    expect(runPersistenceFormats(['--root', root])).toContain('Persistence formats: v5 verified')
  })
})
