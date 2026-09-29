import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createAssistantMessage } from '@orochi-network/oh-llm'
import { SESSION_FORMAT_VERSION, SessionSeq, type SessionEvent } from '@orochi-network/oh-session'
import { parseSessionLog, prepareSessionSnapshotFixtureForComparison } from '@orochi-network/oh-llm-replay'
import { scrubSessionSnapshot } from '@orochi-network/oh-session-snapshot'
import {
  canonicalSessionFixture,
  inspectSessionFixtureLayouts,
  isPhysicalSessionFixture,
} from './session-fixture-layout.ts'

const HEADER = `  {"type":"session","version":${SESSION_FORMAT_VERSION},"id":"fixture","createdAt":1,"isSeeded":false,"delegationDepth":0}  `
const root = resolve(import.meta.dirname, '..')
const refusedVersions = [...Array.from({ length: SESSION_FORMAT_VERSION }, (_, version) => version), 99]
const FIXTURE_MESSAGE = createAssistantMessage({
  content: [{ type: 'text', text: 'part-0part-1part-2part-3' }],
  source: { provider: 'mock', model: 'mock' },
})
const FIXTURE_STREAM: SessionEvent<'assistant/message'>['data']['stream'] = [
  {
    type: 'text-chunks',
    time0: 10,
    index: 0,
    dt: [1, 1, 1],
    texts: ['part-0', 'part-1', 'part-2', 'part-3'],
  },
  { type: 'chunk', time: 14, chunk: { type: 'finish', reason: { kind: 'stop' } } },
]

function assistantMessage(): SessionEvent<'assistant/message'> {
  return {
    type: 'assistant/message',
    seq: SessionSeq(2),
    time: 14,
    data: {
      turn: 1,
      step: 1,
      message: FIXTURE_MESSAGE,
      stream: FIXTURE_STREAM,
    },
    surfaceOp: 'append',
  }
}

function fixtureEvents(): SessionEvent[] {
  return [
    { type: 'turn/start', seq: SessionSeq(0), time: 1, data: { turn: 1 } },
    { type: 'step/start', seq: SessionSeq(1), time: 2, data: { turn: 1, step: 1 } },
    assistantMessage(),
  ]
}

function unpackedFixture(): string {
  return [HEADER, ...fixtureEvents().map(event => JSON.stringify(event)), ''].join('\n')
}

function decodedBody(content: string): SessionEvent[] {
  return parseSessionLog(content)
}

describe('canonicalSessionFixture', () => {
  it.each([
    { sources: [0, 1, 2] },
    { sources: [0, 2] },
    { sources: [2, 0, 1] },
  ])('writes canonical snapshots preserving source reference order: $sources', ({ sources }) => {
    const event = {
      type: 'user/message', seq: 3, time: 15,
      data: { id: 'fixture-user', role: 'user', source: { kind: 'user' }, content: [] },
      sourceEventSeqs: sources, surfaceOp: 'append',
    }
    const raw = [HEADER, ...[...fixtureEvents(), event].map(value => JSON.stringify(value)), ''].join('\n')
    const written = scrubSessionSnapshot(prepareSessionSnapshotFixtureForComparison(raw))

    expect(canonicalSessionFixture(written)).toBe(written)
    expect(decodedBody(written).at(-1)?.sourceEventSeqs).toEqual(sources)
    expect(scrubSessionSnapshot(written)).toBe(written)
  })

  it('preserves the header line and nested compact stream losslessly', () => {
    const canonical = canonicalSessionFixture(unpackedFixture(), 'fixture.jsonl')
    expect(canonical).toBeDefined()
    expect(canonical?.split('\n')[0]).toBe(HEADER)
    const message = canonical?.split('\n')
      .map(line => JSON.parse(line || '{}') as Record<string, unknown>)
      .find(record => record.type === 'assistant/message')
    expect(message).toMatchObject({
      type: 'assistant/message',
      data: {
        stream: FIXTURE_STREAM,
      },
    })
    expect(message).not.toHaveProperty('seq')
    expect(message).not.toHaveProperty('time')
    expect(decodedBody(canonical ?? '').map(({ seq: _seq, time: _time, ...event }) => event))
      .toStrictEqual(fixtureEvents().map(({ seq: _seq, time: _time, ...event }) => event))
  })

  it('ignores JSONL whose first record is not a session header', () => {
    expect(canonicalSessionFixture('{"type":"session_event"}\n{"value":1}\n')).toBeUndefined()
  })

  it('is idempotent for an already packed fixture', () => {
    const packed = canonicalSessionFixture(unpackedFixture())
    expect(packed).toBeDefined()
    expect(canonicalSessionFixture(packed ?? '')).toBe(packed)
  })

  it('is idempotent for an already projected fixture', () => {
    const projected = [
      HEADER,
      '{"type":"turn/start","data":{"turn":1}}',
      '',
    ].join('\n')
    expect(canonicalSessionFixture(projected)).toBe(projected)
  })

  it('preserves owner-restored request-header tokens in current projected fixtures', () => {
    const projected = [
      HEADER,
      '{"type":"turn/start","data":{"turn":1}}',
      '{"type":"request/header","data":{"header":{"config":{"provider":"mock","model":"mock"},"tools":"{{tools}}"},"reason":"initial"}}',
      '',
    ].join('\n')
    expect(canonicalSessionFixture(projected)).toBe(projected)
    expect(decodedBody(projected)[1]).not.toHaveProperty('data.header.tools')
  })

  it('keeps genuine empty current tools for semantic replay to reject', () => {
    const source = [
      HEADER,
      '{"type":"turn/start","data":{"turn":1}}',
      '{"type":"request/header","data":{"header":{"config":{"provider":"mock","model":"mock"},"tools":[]},"reason":"initial"}}',
      '',
    ].join('\n')
    const canonical = canonicalSessionFixture(source)
    expect(canonical).toBe(source)
    expect(() => decodedBody(canonical!)).toThrow(
      /session snapshot line 3: this build refuses the restored V5 artifact: seed request\/header at index 1 must omit empty tools/,
    )
  })

  it('rejects invalid source-event ranges with source line diagnostics', () => {
    expect(() => canonicalSessionFixture(`${HEADER}\n{"type":"feedback/record","data":{},"sourceEventSeqs":[[2,0]]}\n`, 'range.jsonl'))
      .toThrow(/range\.jsonl: session snapshot line 2:.*sourceEventSeqs/)
  })

  it.each(refusedVersions)('refuses a stored header naming format v%i before reading its body', (version) => {
    const header = JSON.stringify({ type: 'session', version, id: 'stored', createdAt: 1, delegationDepth: 0 })
    expect(() => canonicalSessionFixture(`${header}\n{not-json}\n`, 'stored.jsonl'))
      .toThrow(`stored.jsonl: session snapshot line 1: this build reads and writes only format v${SESSION_FORMAT_VERSION}, not v${version}`)
  })

  it('fails loud on malformed records after a session header', () => {
    expect(() => canonicalSessionFixture(`${HEADER}\n{not-json}\n`, 'broken.jsonl'))
      .toThrow(/broken\.jsonl: session snapshot line 2 contains invalid JSON/)
  })

  it('refuses legacy packed rows with the fixture path and line', () => {
    expect(() => canonicalSessionFixture(`${HEADER}\n{"type":"text-chunks"}\n`, 'broken.jsonl'))
      .toThrow(/broken\.jsonl: session snapshot line 2: current projected fixtures cannot contain legacy packed rows/)
  })
})

describe('isPhysicalSessionFixture', () => {
  it('recognizes fixtures that preserve physical persistence encoding', () => {
    expect(isPhysicalSessionFixture(
      'packages/experimental/webworker-runtime/tests/fixtures/vfs-example/home/sessions/--oh-workspace--/main/session.jsonl',
    )).toBe(true)
    expect(isPhysicalSessionFixture(
      'packages/experimental/webworker-runtime/tests/fixtures/vfs-example/home/sessions/--oh-workspace--/main/session.v1.jsonl',
    )).toBe(true)
    expect(isPhysicalSessionFixture(
      'scripts/snapshots/python-sdk-single-exe/advanced/session.1.jsonl',
    )).toBe(true)
    expect(isPhysicalSessionFixture(
      'scripts/snapshots/python-sdk-single-exe/advanced/session.1.v1.jsonl',
    )).toBe(true)
    expect(isPhysicalSessionFixture(
      'scripts/snapshots/python-sdk-single-exe/advanced/session.jsonl',
    )).toBe(true)
    expect(isPhysicalSessionFixture(
      'scripts/snapshots/python-sdk-single-exe/restart/session.2.jsonl',
    )).toBe(true)
    expect(isPhysicalSessionFixture(
      'packages/experimental/webworker-runtime/tests/fixtures/vfs-example/home/sessions/README.jsonl',
    )).toBe(false)
    expect(isPhysicalSessionFixture(
      'scripts/snapshots/python-sdk-single-exe/advanced/requests.jsonl',
    )).toBe(false)
    expect(isPhysicalSessionFixture('apps/web/tests/snapshots/example/session.jsonl')).toBe(false)
  })
})

it('leaves stored artifacts naming another generation untouched and unread', () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'oh-session-fixture-layout-'))
  try {
    execFileSync('git', ['init', '--quiet'], { cwd: fixtureRoot })
    writeFileSync(join(fixtureRoot, 'stored.jsonl'),
      `{"type":"session","version":${SESSION_FORMAT_VERSION - 1},"id":"stored","createdAt":1,"delegationDepth":0}\n{not-json}\n`)
    writeFileSync(join(fixtureRoot, 'current.jsonl'), `${HEADER}\n{"type":"turn/start","data":{"turn":1}}\n`)
    const inspected = inspectSessionFixtureLayouts(fixtureRoot)
    expect(inspected.map(fixture => fixture.path)).toEqual(['current.jsonl'])
    expect(inspected[0]?.canonical).toBe(inspected[0]?.source)
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true, maxRetries: 3 })
  }
})

it('keeps every session fixture this build reads projected into canonical event layout', () => {
  const nonCanonical = inspectSessionFixtureLayouts(root)
    .filter(fixture => fixture.source !== fixture.canonical)
    .map(fixture => fixture.path)
  expect(
    nonCanonical,
    'Run `pnpm run migrate:packed-session-fixtures` and commit the mechanical fixture rewrite.',
  ).toEqual([])
})
