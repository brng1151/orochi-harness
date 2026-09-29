/** Single installed V5 Session writer: physical framing plus every native admission rule. */

import { isSessionFormatJsonObject } from '@orochi-network/oh-session-format'
import type {
  SessionFormatArtifactDecoder,
  SessionFormatCodec,
  SessionFormatCurrentEncoder,
  SessionFormatEvent,
  SessionFormatHeader,
  SessionFormatMigrationContext,
  SessionFormatRecovery,
} from '@orochi-network/oh-session-format'
import { assertV5DeveloperData } from './developer-v4.ts'
import { assertV5ForkResult } from './fork-result-v4.ts'
import { assertV5SourceRowAdmission } from './message-sources-v4.ts'
import { sessionFormatPhysicalCodec } from './physical.ts'
import { assertV5RetiredSyntax } from './retired-syntax-v4.ts'
import { assertV5SystemMessageFields } from './system-message-v4.ts'
import { assertV5ToolResultMessage } from './tool-role-v4.ts'

/** The Session event type V5 no longer declares; a V5 artifact may not carry it. */
export const RETIRED_DELIVERY_EVENT_TYPE = 'session-log-deepseek/delivery-accepted'

/**
 * Apply native V5 row admission before a scanner discards a recoverable suffix.
 * Ignorable developer payloads require reader vocabulary; physical decoding defers them.
 * @param row - parsed physical row before framing and source-event range decoding.
 * @param knownEventTypes - installed event types, supplied by native readers before tail recovery.
 */
export function assertV5RowAdmission(row: unknown, knownEventTypes?: ReadonlySet<string>): void {
  if (isSessionFormatJsonObject(row)) {
    if (row['type'] === 'developer/message' && row['ignorable'] === true
      && knownEventTypes?.has('developer/message') !== true) return
    assertV5DeveloperData(row as unknown as SessionFormatEvent)
  }
  assertV5SourceRowAdmission(row)
  assertV5RetiredSyntax(row)
  assertV5SystemMessageFields(row)
  if (!isSessionFormatJsonObject(row) || row['type'] !== 'tool/result') return
  const event = row as unknown as SessionFormatEvent
  assertV5ToolResultMessage(event)
  assertV5ForkResult(event)
}

/**
 * The installed Session writer. V5 keeps the physical row framing every later
 * generation inherited and adds no field of its own, so its admission is the
 * native V5 row, message-source, and retired-syntax set over that framing.
 */
export const sessionFormatV5Codec = Object.freeze({
  version: 5,
  decodeHeader(value: unknown) {
    return sessionFormatPhysicalCodec.decodeHeader(value)
  },
  createDecoder(value: unknown, recovery: SessionFormatRecovery): SessionFormatArtifactDecoder {
    const decoder = sessionFormatPhysicalCodec.createDecoder(value, recovery)
    return {
      ...decoder,
      decodeRow(row, context) {
        assertV5RowAdmission(row)
        decoder.decodeRow(row, {
          emitRun: context.emitRun.bind(context),
          emitEvent: context.emitEvent.bind(context),
        })
      },
      finish(context: SessionFormatMigrationContext) {
        return decoder.finish(context)
      },
    }
  },
  encodeHeader(header: SessionFormatHeader, inheritedEventCount: number) {
    return sessionFormatPhysicalCodec.encodeHeader(header, inheritedEventCount)
  },
  encodeEvent(event: SessionFormatEvent) {
    if (event.type === 'developer/message' && event['ignorable'] === true) assertV5DeveloperData(event)
    assertV5RowAdmission(event)
    return sessionFormatPhysicalCodec.encodeEvent(event)
  },
} satisfies SessionFormatCodec & SessionFormatCurrentEncoder)
