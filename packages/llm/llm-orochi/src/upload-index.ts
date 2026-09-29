/** Durable Orochi attachment-to-file-id index. @module oh-llm-orochi/upload-index */

import { createHash } from 'node:crypto'
import { readFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { withFileLock, writeFileAtomic } from '@orochi-network/oh-atomic-write'
import { resolveOhHome } from '@orochi-network/oh-home-paths'
import { ImageVariantId } from '@orochi-network/oh-attachment'
import type { AttachmentId, ImageVariantId as ImageVariantIdType } from '@orochi-network/oh-attachment'
import { OrochiFileId, OrochiFileScope } from './file-id.ts'
import type { OrochiFileId as OrochiFileIdType, OrochiFileScope as OrochiFileScopeType } from './file-id.ts'

/** One durable remote upload mapping. Unix times are milliseconds. */
export interface OrochiUploadRecord {
  scope: OrochiFileScopeType
  /** Provider-independent normalized attachment from which the uploaded request version was derived. */
  attachmentId: AttachmentId
  /** Complete request transformation identity, including route budgets and encoder parameters. */
  variantId: ImageVariantIdType
  fileId: OrochiFileIdType
  bytes: number
  createdAt: number
  expiresAt: number
}

interface StoredIndex {
  formatVersion: 3
  records: OrochiUploadRecord[]
}

class InvalidUploadIndexError extends Error {}

/** Candidate commit outcome when another process already published a reusable upload. */
export interface UploadIndexCommit {
  record: OrochiUploadRecord
  accepted: boolean
}

/**
 * Derive a non-secret stable index namespace without persisting or logging authentication headers.
 * @param baseURL - normalized provider endpoint namespace.
 * @param credentials - serialized authentication headers used only as hash input.
 * @returns branded SHA-256 namespace digest.
 */
export function orochiFileScope(baseURL: string, credentials: string): OrochiFileScopeType {
  const digest = createHash('sha256')
    .update(baseURL.replace(/\/+$/u, ''))
    .update('\0')
    .update(credentials)
    .digest('hex')
  return OrochiFileScope(digest)
}

function absent(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | null)?.code === 'ENOENT'
}

function parseRecord(value: unknown): OrochiUploadRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new InvalidUploadIndexError('llm-orochi: upload index contains a non-object record')
  }
  const record = value as Record<string, unknown>
  if (typeof record.scope !== 'string' || !/^[0-9a-f]{64}$/u.test(record.scope)
    || typeof record.attachmentId !== 'string' || !/^sha256:[0-9a-f]{64}$/u.test(record.attachmentId)
    || typeof record.variantId !== 'string' || !/^sha256:[0-9a-f]{64}$/u.test(record.variantId)
    || typeof record.fileId !== 'string' || record.fileId.length === 0
    || !Number.isSafeInteger(record.bytes) || (record.bytes as number) < 0
    || !Number.isSafeInteger(record.createdAt) || (record.createdAt as number) < 0
    || !Number.isSafeInteger(record.expiresAt) || (record.expiresAt as number) < 0) {
    throw new InvalidUploadIndexError('llm-orochi: upload index contains an invalid record')
  }
  return {
    scope: OrochiFileScope(record.scope),
    attachmentId: record.attachmentId as AttachmentId,
    variantId: ImageVariantId(record.variantId),
    fileId: OrochiFileId(record.fileId),
    bytes: record.bytes as number,
    createdAt: record.createdAt as number,
    expiresAt: record.expiresAt as number,
  }
}

function parseIndex(text: string): StoredIndex {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch (error: unknown) {
    throw new InvalidUploadIndexError('llm-orochi: upload index is not valid JSON', { cause: error })
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new InvalidUploadIndexError('llm-orochi: upload index is not an object')
  }
  const index = value as { formatVersion?: unknown; records?: unknown }
  if (index.formatVersion !== 3 || !Array.isArray(index.records)) {
    throw new InvalidUploadIndexError('llm-orochi: unsupported upload index format')
  }
  const records = index.records.map(parseRecord)
  const keys = new Set<string>()
  for (const record of records) {
    const key = `${record.scope}\0${record.variantId}`
    if (keys.has(key)) throw new InvalidUploadIndexError('llm-orochi: upload index contains duplicate mappings')
    keys.add(key)
  }
  return { formatVersion: 3, records }
}

function reusable(record: OrochiUploadRecord, now: number, refreshMarginMs: number): boolean {
  return record.expiresAt - now > refreshMarginMs
}

/** Atomic local index shared by every Orochi session in this OH home. */
export class OrochiUploadIndex {
  /** Absolute owner-private JSON index path. */
  readonly path: string

  /**
   * @param path - explicit test path; omission uses `OH_HOME/llm-orochi/files-v3.json`.
   */
  constructor(path = join(resolveOhHome(), 'llm-orochi', 'files-v3.json')) {
    this.path = path
  }

  private async load(): Promise<StoredIndex> {
    try {
      return parseIndex(await readFile(this.path, 'utf8'))
    } catch (error: unknown) {
      if (absent(error) || error instanceof InvalidUploadIndexError) {
        return { formatVersion: 3, records: [] }
      }
      throw error
    }
  }

  private async save(index: StoredIndex): Promise<void> {
    await writeFileAtomic(this.path, `${JSON.stringify(index, undefined, 2)}\n`, {
      mode: 0o600,
      dirMode: 0o700,
    })
  }

  /**
   * Read one reusable mapping.
   * @param scope - endpoint/API-key namespace.
   * @param variantId - complete request-image transformation identity.
   * @param now - current Unix time in milliseconds.
   * @param refreshMarginMs - remaining lifetime below which a mapping is not reused.
   * @returns the mapping when it has enough lifetime remaining.
   */
  async get(
    scope: OrochiFileScopeType,
    variantId: ImageVariantIdType,
    now: number,
    refreshMarginMs: number,
  ): Promise<OrochiUploadRecord | undefined> {
    const record = (await this.load()).records.find(candidate => (
      candidate.scope === scope && candidate.variantId === variantId
    ))
    return record !== undefined && reusable(record, now, refreshMarginMs) ? record : undefined
  }

  /**
   * Publish a completed upload unless another process already published a reusable mapping.
   * @param candidate - completed remote upload.
   * @param now - current Unix time in milliseconds.
   * @param refreshMarginMs - minimum reusable remaining lifetime.
   * @returns the winning record and whether the candidate entered the index.
   */
  async commit(
    candidate: OrochiUploadRecord,
    now: number,
    refreshMarginMs: number,
  ): Promise<UploadIndexCommit> {
    await mkdir(dirname(this.path), { recursive: true, mode: 0o700 })
    return withFileLock(this.path, async () => {
      const index = await this.load()
      const existing = index.records.find(record => (
        record.scope === candidate.scope
        && record.variantId === candidate.variantId
        && reusable(record, now, refreshMarginMs)
      ))
      if (existing !== undefined) return { record: existing, accepted: false }
      const records = index.records.filter(record => (
        reusable(record, now, refreshMarginMs)
        && !(record.scope === candidate.scope && record.variantId === candidate.variantId)
      ))
      records.push(candidate)
      await this.save({ formatVersion: 3, records })
      return { record: candidate, accepted: true }
    })
  }

  /**
   * Remove exact mappings in one locked rewrite without deleting concurrently installed successors.
   * @param scope - endpoint/API-key namespace.
   * @param generations - exact remote generations being invalidated; pairs absent from the index are ignored.
   */
  async remove(
    scope: OrochiFileScopeType,
    generations: readonly Pick<OrochiUploadRecord, 'variantId' | 'fileId'>[],
  ): Promise<void> {
    const invalidated = new Set(generations.map(generation => `${generation.variantId}\0${generation.fileId}`))
    await mkdir(dirname(this.path), { recursive: true, mode: 0o700 })
    await withFileLock(this.path, async () => {
      const index = await this.load()
      const records = index.records.filter(record => !(
        record.scope === scope && invalidated.has(`${record.variantId}\0${record.fileId}`)
      ))
      if (records.length !== index.records.length) await this.save({ formatVersion: 3, records })
    })
  }

  /**
   * Remove every local mapping for one remote namespace.
   * @param scope - endpoint/API-key namespace.
   */
  async clear(scope: OrochiFileScopeType): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true, mode: 0o700 })
    await withFileLock(this.path, async () => {
      const index = await this.load()
      const records = index.records.filter(record => record.scope !== scope)
      if (records.length !== index.records.length) await this.save({ formatVersion: 3, records })
    })
  }
}
