import { describe, expect, it } from 'vitest'
import type { SessionFormatEvent } from '@orochi-network/oh-session-format'
import { sessionFormatCatalog } from '../src/index.ts'
import { currentSessionMessageProjections } from '../src/message-projections.ts'
import { MESSAGE_PROJECTION_EVENT_TYPES } from '@orochi-network/oh-session/src/known-event-types.ts'
import { validateInstalledCurrentSessionArtifact } from '../src/current.ts'
import { SESSION_FORMAT_VERSION, Session, SessionId } from '@orochi-network/oh-session'
import { createUserMessage } from '@orochi-network/oh-llm'

function currentHeader(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    type: 'session',
    version: SESSION_FORMAT_VERSION,
    id: 'current',
    createdAt: 1,
    isSeeded: false,
    delegationDepth: 0,
    ...overrides,
  }
}

function restoreCurrent(rows: readonly unknown[], header = currentHeader(), validation: 'current' | 'transformed' = 'current') {
  const restore = sessionFormatCatalog.createRestore(header, { recovery: 'strict', validation })
  for (const row of rows) restore.decodeRow(row)
  return restore.finish()
}

describe('first-party Session format catalog', () => {
  it('supplies every required current message interpreter and validates its durable references', () => {
    expect(currentSessionMessageProjections.map(projection => projection.type).sort())
      .toEqual([...MESSAGE_PROJECTION_EVENT_TYPES].sort())
    const session = Session.create(SessionId('projection-catalog'))
    session.append('user/message', createUserMessage({ content: [{ type: 'text', text: 'no image' }], source: { kind: 'user' } }), { surfaceOp: 'append' })
    const artifact = {
      header: { ...session.header, delegationDepth: 0 }, inheritedEventCount: 0,
      events: [...session.snapshotEvents() as unknown as SessionFormatEvent[], { type: 'image/offload', seq: 1, time: 0, data: { targets: [{ seq: 0, imageIndexes: [0] }] } }],
    }
    expect(() => { validateInstalledCurrentSessionArtifact(artifact) }).toThrow(/image index 0 does not exist/)
  })

  it('declares the core writer constant as its only supported generation', () => {
    expect(sessionFormatCatalog.currentVersion).toBe(SESSION_FORMAT_VERSION)
    expect(sessionFormatCatalog.readHeader(currentHeader())).toMatchObject({
      status: 'current',
      storedVersion: SESSION_FORMAT_VERSION,
      targetVersion: SESSION_FORMAT_VERSION,
      header: { version: SESSION_FORMAT_VERSION, id: 'current' },
    })
  })

  it.each([0, 1, 2, 3, 4, 6])('refuses a stored v%i generation instead of migrating it', (version) => {
    expect(sessionFormatCatalog.readHeader(currentHeader({ version }))).toEqual({
      status: 'unsupported',
      storedVersion: version,
      targetVersion: SESSION_FORMAT_VERSION,
      reason: `stored Session uses format v${version}; this build reads and writes only v${SESSION_FORMAT_VERSION}`,
    })
    expect(() => sessionFormatCatalog.createRestore(currentHeader({ version }), { recovery: 'strict', validation: 'current' }))
      .toThrow(`stored Session uses format v${version}`)
  })

  it('round-trips the installed current vocabulary without freezing ordinary payload additions', () => {
    const extended = restoreCurrent([{ type: 'turn/start', seq: 0, time: 1, data: { turn: 1, postReleaseMember: true } }])
    expect(extended.events).toEqual([{ type: 'turn/start', seq: 0, time: 1, data: { turn: 1, postReleaseMember: true } }])

    expect(() => restoreCurrent([{ type: 'ordinary/not-installed', seq: 0, time: 1, data: 'future' }]))
      .toThrow(/unknown event type/)

    const extension = { type: 'ordinary/external', seq: 0, time: 1, data: null, ignorable: true }
    expect(restoreCurrent([extension]).events).toEqual([extension])
  })

  it.each([0, 1])('restores an inherited prefix of %i events with its exact cut', (seedLength) => {
    const header = currentHeader({ id: 'seeded', parentSession: 'parent', isSeeded: seedLength > 0 })
    const rows: unknown[] = [{ type: 'turn/start', seq: 0, time: 1, data: { turn: 1 } }]
    if (seedLength > 0) rows.push({ type: 'session/end-seed', seq: 1, time: 2, data: { inherited: true } })
    const artifact = restoreCurrent(rows, header)
    expect(artifact.header.isSeeded).toBe(seedLength > 0)
    expect(artifact.inheritedEventCount).toBe(seedLength)
    expect(artifact.events.at(-1)).toEqual(
      seedLength > 0 ? { type: 'session/end-seed', seq: 1, time: 2, data: { inherited: true } } : { type: 'turn/start', seq: 0, time: 1, data: { turn: 1 } },
    )
  })

  it('refuses the retired delivery record in V5 input', () => {
    expect(() => restoreCurrent([
      { type: 'turn/start', seq: 0, time: 1, data: { turn: 1 } },
      { type: 'session-log-deepseek/delivery-accepted', seq: 1, time: 2, data: { sessionId: 'current', throughSeq: 0, sessionFormatVersion: 4 } },
    ])).toThrow(/unknown event type/)
  })

  it.each(['current', 'transformed'] as const)('refuses obsolete required PTC dispatch tags in V5 input (%s)', (validation) => {
    for (const type of ['tool/code-dispatch-start', 'tool/code-dispatch']) {
      expect(() => restoreCurrent([{ type, seq: 0, time: 1, data: null }], currentHeader(), validation))
        .toThrow(`format v4 rejects retired event type ${type}`)
    }
  })

  it('retains an ignorable retired tag as uninterpreted external content', () => {
    const ignorable = {
      type: 'tool/code-dispatch', seq: 0, time: 1, ignorable: true,
      data: { text: 'tools-code-mode', source: { kind: 'plugin', plugin: 'tools-code-mode' } },
    }
    expect(restoreCurrent([ignorable]).events).toEqual([ignorable])
  })

  it('re-encodes a restored artifact to a V5 header and rows the catalog reopens unchanged', () => {
    const artifact = restoreCurrent([
      { type: 'turn/start', seq: 0, time: 1, data: { turn: 1 } },
      { type: 'step/start', seq: 1, time: 2, data: { turn: 1, step: 1 } },
      { type: 'step/end', seq: 2, time: 3, data: { turn: 1, step: 1 } },
      { type: 'turn/end', seq: 3, time: 4, data: { turn: 1, reason: { kind: 'completed' } } },
    ])
    const header = sessionFormatCatalog.encodeCurrentHeader(artifact.header, artifact.inheritedEventCount)
    const rows = artifact.events.map(event => sessionFormatCatalog.encodeCurrentEvent(event))
    const reopened = sessionFormatCatalog.createRestore(header, { recovery: 'strict', validation: 'current' })
    for (const row of rows) reopened.decodeRow(row)
    expect(reopened.finish()).toEqual(artifact)
  })

  it('refuses a physical header outside the installed generation before reading a body', () => {
    expect(() => sessionFormatCatalog.createRestore({ ...currentHeader(), version: 4 }, { recovery: 'strict', validation: 'current' }))
      .toThrow(/this build reads and writes only v5/)
  })
})
