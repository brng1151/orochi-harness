/** Native V5 header, artifact, and generation-owned relationship validation. */

import { isAbsolute } from 'node:path'
import { SessionFormatError, SessionFormatUnsupportedMigrationError, isSessionFormatJsonObject, sessionFormatCount } from '@orochi-network/oh-session-format'
import type { SessionFormatArtifact } from '@orochi-network/oh-session-format'
import { assertV5DeveloperData } from './developer-v4.ts'
import { assertV5LifecycleRelationships } from './relationships-v4.ts'
import { assertV5MessageSources } from './message-sources-v4.ts'
import { catalogFact } from './facts-v4.ts'
import { assertV5RetiredSyntax } from './retired-syntax-v4.ts'
import { assertV5SystemMessageFields } from './system-message-v4.ts'
import { assertV5ForkResult } from './fork-result-v4.ts'
import { assertV5ToolResultMessage } from './tool-role-v4.ts'

/**
 * Validate the exact native V5 logical header.
 * @param header - decoded or otherwise untrusted V5 Session header candidate.
 */
export function assertV5Header(header: unknown): void {
  if (!isSessionFormatJsonObject(header) || header['version'] !== 5) throw new SessionFormatError('expected format v5 header')
  const required = ['version', 'id', 'createdAt', 'isSeeded', 'delegationDepth']
  const allowed = new Set([...required, 'cwd', 'parentSession', 'origin', 'agentPreset'])
  const missing = required.find(key => !Object.hasOwn(header, key))
  const unexpected = Object.keys(header).find(key => !allowed.has(key))
  if (missing !== undefined) throw new SessionFormatError(`format v5 header lacks required field ${missing}`)
  if (unexpected !== undefined) throw new SessionFormatError(`format v5 header has unexpected field ${unexpected}`)
  if (typeof header.id !== 'string') throw new SessionFormatError('format v5 header id must be a string')
  sessionFormatCount(header.createdAt, 'format v5 header createdAt')
  sessionFormatCount(header.delegationDepth, 'format v5 header delegationDepth')
  if (typeof header.isSeeded !== 'boolean') throw new SessionFormatError('format v5 header isSeeded must be boolean')
  if (header.cwd !== undefined && (typeof header.cwd !== 'string' || !isAbsolute(header.cwd))) {
    throw new SessionFormatError('format v5 header cwd must be absolute')
  }
  for (const key of ['parentSession', 'agentPreset']) {
    if (header[key] !== undefined && typeof header[key] !== 'string') {
      throw new SessionFormatError(`format v5 header ${key} must be a string`)
    }
  }
  if (header.origin !== undefined && header.origin !== 'subagent') {
    throw new SessionFormatError('format v5 header origin must be "subagent"')
  }
}

/**
 * Validate V5 inheritance, vocabulary, native message admission, and
 * lifecycle, compaction, tool, retry, title, command, and catalog ownership.
 * Installed Session restoration owns common event envelopes and message acceptance.
 * @param artifact - complete detached V5 artifact.
 * @param knownEventTypes - event types understood by the installed Session package.
 * @returns the same validated artifact and event objects.
 */
export function restoreV5Artifact(artifact: SessionFormatArtifact, knownEventTypes: ReadonlySet<string>): SessionFormatArtifact {
  assertV5Header(artifact.header)
  const cut = sessionFormatCount(artifact.inheritedEventCount, 'format v5 inherited event count')
  if (cut > artifact.events.length) throw new SessionFormatError('format v5 inherited event count exceeds its events')
  if (!artifact.header.isSeeded && cut !== 0) throw new SessionFormatError('unseeded format v5 Session has inherited events')
  let lastInheritedMarker: number | undefined
  for (const [index, event] of artifact.events.entries()) {
    if (!knownEventTypes.has(event.type) && event['ignorable'] !== true) {
      throw new SessionFormatUnsupportedMigrationError(
        `format v5 contains unknown event type ${JSON.stringify(event.type)} at seq ${index}`,
      )
    }
    if (event.seq !== index) throw new SessionFormatError(`format v5 event ${index} is not dense`)
    if (!knownEventTypes.has(event.type)) continue
    assertV5RetiredSyntax(event)
    assertV5SystemMessageFields(event)
    assertV5ToolResultMessage(event)
    assertV5ForkResult(event)
    if (event.type === 'session/end-seed' && isSessionFormatJsonObject(event.data)
      && event.data['inherited'] === true) lastInheritedMarker = index
  }
  if (artifact.header.isSeeded && lastInheritedMarker !== cut) {
    throw new SessionFormatError('format v5 seeded header disagrees with its last inherited end-seed marker')
  }
  if (!artifact.header.isSeeded && lastInheritedMarker !== undefined) {
    throw new SessionFormatError('format v5 unseeded Session contains an inherited end-seed marker')
  }
  assertV5Relationships(artifact, knownEventTypes)
  return artifact
}

/**
 * Validate native developer fields, message sources, lifecycle, and catalog
 * relationships without changing event vocabulary or tail recovery. The owning
 * admission stage rejects unknown required events; unknown ignorable records
 * retain their uninterpreted payloads.
 * @param artifact - decoded artifact with its final inherited cut.
 * @param knownEventTypes - installed event types whose payloads this reader interprets.
 */
export function assertV5Relationships(artifact: SessionFormatArtifact, knownEventTypes: ReadonlySet<string>): void {
  const ids = new Set<string>()
  for (const event of artifact.events) {
    if (!knownEventTypes.has(event.type)) continue
    assertV5DeveloperData(event)
    assertV5MessageSources(event)
    if (event.type === 'subagent/catalog' && event.seq >= artifact.inheritedEventCount) {
      const fact = catalogFact(event.data)
      const id = fact['childId'] as string
      if (ids.has(id)) throw new SessionFormatError(`duplicate catalog child ${id}`)
      ids.add(id)
    }
  }
  assertV5LifecycleRelationships(artifact, knownEventTypes)
}
