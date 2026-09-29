/** Node-side Session preparation for browser Preview data overlays. */

import { posix } from 'node:path'
import { isSessionFormatJsonObject, parseSessionFormatLogFilename } from '@orochi-network/oh-session-format'
import { sessionFormatCatalog } from '@orochi-network/oh-session-format-catalog'
import { packVfsOverlay, type ImageTree, type PackOverlayResult } from './pack.ts'
import type { ImageFiles } from './transform-image.ts'

interface PreviewSession {
  readonly path: string
  readonly directory: string
  readonly id: string
  readonly version: number
  readonly bytes: Uint8Array
}

/**
 * Pack Preview data after validating every selected Session against the installed writer.
 * Committed source bytes pass through unchanged; the newest canonical raw generation of
 * each Session is restored, and a generation this build cannot read refuses the pack.
 * @param trees - Ordered source trees under the Preview's home and workspace mounts.
 * @returns Deterministic overlay containing the unchanged validated inputs.
 */
export function packPreviewFixture(trees: readonly ImageTree[]): PackOverlayResult {
  const overlay = packVfsOverlay(trees)
  for (const source of selectedSessions(overlay.files)) {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(source.bytes)
    if (!text.endsWith('\n')) throw new Error(`preview fixture: ${source.path} has a torn physical tail`)
    const [headerLine = '', ...rows] = text.slice(0, -1).split('\n')
    const header: unknown = JSON.parse(headerLine)
    if (!isSessionFormatJsonObject(header) || header['version'] !== source.version || header['id'] !== source.id) {
      throw new Error(`preview fixture: ${source.path} disagrees with its Session header`)
    }
    const restore = sessionFormatCatalog.createRestore(header, { recovery: 'strict', validation: 'current' })
    for (const row of rows) restore.decodeRow(JSON.parse(row) as unknown)
    restore.finish()
  }
  return overlay
}

function selectedSessions(files: ImageFiles): readonly PreviewSession[] {
  const selected = new Map<string, PreviewSession>()
  for (const [path, bytes] of Object.entries(files)) {
    const match = /^home\/sessions\/[^/]+\/([^/]+)\/(session(?:\..*)?\.jsonl(?:\.zstd)?)$/u.exec(path)
    if (match === null) continue
    const version = parseSessionFormatLogFilename(match[2] as string)
    if (version === undefined) throw new Error(`preview fixture: ${path} must name a canonical raw Session generation`)
    const directory = posix.dirname(path)
    const previous = selected.get(directory)
    if (previous === undefined || previous.version < version) {
      selected.set(directory, { path, directory, id: match[1] as string, version, bytes })
    }
  }
  return [...selected.values()]
}
