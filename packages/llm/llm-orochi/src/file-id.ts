/** Orochi Files API identifiers. @module oh-llm-orochi/file-id */

import type { Branded } from '@orochi-network/oh-brand'

/** Opaque identifier returned by the Orochi Files API. */
export type OrochiFileId = Branded<'OrochiFileId'>

/**
 * Brand a provider-returned file identifier after wire validation.
 * @param id - non-empty Files API identifier.
 * @returns the same string with its provider identity attached at type level.
 */
export function OrochiFileId(id: string): OrochiFileId {
  return id as OrochiFileId
}

/** Non-secret digest identifying one endpoint and API-key file namespace. */
export type OrochiFileScope = Branded<'OrochiFileScope'>

/**
 * Brand a locally derived namespace digest.
 * @param scope - SHA-256 digest of endpoint and API key.
 * @returns the same string with namespace identity attached at type level.
 */
export function OrochiFileScope(scope: string): OrochiFileScope {
  return scope as OrochiFileScope
}
