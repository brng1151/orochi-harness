/** Verify the installed Session format reference and generated catalog. */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { readCurrentSessionFormatVersion } from './gen-session-format-catalog.ts'
import { parsePersistenceSnapshot } from './persistence-changes.ts'
import { persistenceFormatFactArtifacts } from './persistence-format-facts.ts'
import { canonicalizeSchema, schemaDigest } from './persistence-schema-model.ts'
import type { PersistenceSchemaInventory } from './persistence-schema-model.ts'

const DIRECTORY = 'docs/persistence-changes/historical-formats'
const CURRENT_DOCUMENT = 'docs/persistence-catalog.md'
const CURRENT_SCHEMA = 'docs/persistence-schema.json'

/** The one installed format reference. */
export interface PersistenceFormatEntry {
  readonly version: number
  readonly document: string
  readonly schemaPath: string
  readonly inventory: PersistenceSchemaInventory
}

/** The installed writer's format reference. */
export interface PersistenceFormats {
  readonly currentVersion: number
  readonly entries: readonly PersistenceFormatEntry[]
}

function validateInventory(inventory: PersistenceSchemaInventory, version: number, current: boolean): ReadonlySet<string> {
  const label = `v${version}`
  for (const key of ['SessionHeader', 'JsonlHeaderLine', 'SessionEventEnvelope']) {
    const root = inventory.roots.find(root => root.key === key)
    if (root === undefined) throw new Error(`${label}: missing schema root ${key}`)
    if (root.kind !== 'header') continue
    const node = root.schema.nodes[0]
    const field = node?.kind === 'object' ? node.properties.find(property => property.name === 'version') : undefined
    const type = field === undefined ? undefined : root.schema.nodes[field.type]
    const legacyNumber = !(current && key === 'SessionHeader') && type?.kind === 'primitive' && type.type === 'number'
    if (field?.optional !== false || !(legacyNumber || type?.kind === 'literal' && type.value === version)) {
      throw new Error(`${label}: ${key}.version must match the ${current ? 'current writer' : 'recorded format'} version`)
    }
  }
  if (!inventory.roots.some(root => root.kind === 'event')) throw new Error(`${label}: complete inventory must include an event root`)
  const reachable = new Set(inventory.roots.flatMap(root => root.schema.nodes
    .map((_, index) => schemaDigest(canonicalizeSchema(root.schema.nodes, index)))))
  const remaining = new Set(reachable)
  const listed = new Set<string>()
  for (const type of inventory.types) {
    if (listed.has(type.digest)) throw new Error(`${label}: duplicate schema type ${type.digest}`)
    listed.add(type.digest)
    // The current extractor can retain types erased by normalization; its generator gate checks that inventory.
    if (!current && !reachable.has(type.digest)) throw new Error(`${label}: unreferenced schema type ${type.digest}`)
    remaining.delete(type.digest)
  }
  if (remaining.size > 0) throw new Error(`${label}: schema types must cover every reachable type`)
  return reachable
}

function validateDocument(
  document: string, schemaName: string, inventory: PersistenceSchemaInventory, label: string, current: boolean,
): void {
  if (!document.includes(`](${schemaName})`)) throw new Error(`${label}: missing link to ${schemaName}`)
  if (!current) return
  for (const root of inventory.roots) {
    const row = `| \`${root.key}\` | ${root.kind} | \`${root.digest}\` |`
    if (!document.includes(row)) throw new Error(`${label}: missing schema index entry for ${root.key}`)
  }
}

/**
 * Read the installed writer's format reference and complete inventory.
 *
 * This build ships one Session format generation, so the only reference is the
 * generated current catalog; a leftover `vN` artifact names a generation the
 * build cannot read and is refused.
 *
 * @param root - checkout root containing the writer declaration and generated catalog.
 * @returns the single installed format reference.
 */
export function loadPersistenceFormats(root: string): PersistenceFormats {
  const currentVersion = readCurrentSessionFormatVersion(root)
  const directory = join(root, DIRECTORY)
  const files = (existsSync(directory) ? readdirSync(directory) : []).filter(file => /^v\d/.test(file))
  if (files.length > 0) {
    throw new Error(`unexpected persistence format artifact ${files[0]}: this build reads and writes only v${currentVersion}`)
  }
  const read = (path: string): string => {
    if (!existsSync(join(root, path))) throw new Error(`missing persistence format artifact ${path}`)
    return readFileSync(join(root, path), 'utf8').replaceAll('\r\n', '\n')
  }
  const inventory = parsePersistenceSnapshot(JSON.parse(read(CURRENT_SCHEMA)))
  validateInventory(inventory, currentVersion, true)
  const document = CURRENT_DOCUMENT
  validateDocument(read(document), 'persistence-schema.json', inventory, document, true)
  validateDocument(read(CURRENT_DOCUMENT.replace(/\.md$/u, '.zh.md')), 'persistence-schema.json', inventory, CURRENT_DOCUMENT.replace(/\.md$/u, '.zh.md'), true)
  return {
    currentVersion,
    entries: [{ version: currentVersion, document, schemaPath: CURRENT_SCHEMA, inventory }],
  }
}

/**
 * Validate and optionally refresh the installed format reference.
 * @param args - --write refreshes validated facts.
 * @param root - default checkout directory, overridden by --root when provided.
 * @returns the created schema path or verified format count and refreshed artifact count.
 */
export function runPersistenceFormats(args: readonly string[], root = resolve(import.meta.dirname, '..')): string {
  const { values } = parseArgs({ args: [...args], options: { root: { type: 'string' }, write: { type: 'boolean' } } })
  root = resolve(values.root ?? root)
  const formats = loadPersistenceFormats(root)
  const changed = persistenceFormatFactArtifacts(root, formats).filter(artifact => !existsSync(join(root, artifact.path))
    || readFileSync(join(root, artifact.path), 'utf8') !== artifact.content)
  if (!values.write && changed.length > 0) throw new Error(`Stale persistence format facts: ${changed.map(artifact => artifact.path).join(', ')}. Run pnpm run verify-persistence-formats --write.`)
  if (values.write) for (const artifact of changed) writeFileSync(join(root, artifact.path), artifact.content)
  return `Persistence formats: v${formats.currentVersion} verified (${formats.entries.length} complete reference${formats.entries.length === 1 ? '' : 's'}).`
    + (values.write ? ` Refreshed ${changed.length} file${changed.length === 1 ? '' : 's'}.` : '')
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === import.meta.filename) {
  try {
    console.log(runPersistenceFormats(process.argv.slice(2)))
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
