import { freezeMessage, MessageId } from '@orochi-network/oh-llm'
import { Context } from '@orochi-network/cordis'
import { Session, SessionId } from '@orochi-network/oh-session'
import type { SessionHandle } from '@orochi-network/oh-session-persistence'
import JsonlSessionPersistence from '@orochi-network/oh-session-persistence-jsonl'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const id = SessionId('system-prompt-persistence')
let root: string
const contexts: Context[] = []

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'oh-system-prompt-persistence-'))
})

afterEach(async () => {
  try {
    for (const ctx of contexts.splice(0).reverse()) await ctx.fiber.dispose()
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

async function mount(): Promise<Context> {
  const ctx = new Context()
  contexts.push(ctx)
  await ctx.plugin(JsonlSessionPersistence, { root, compression: 'none' })
  return ctx
}

async function restore(handle: SessionHandle): Promise<Session> {
  const read = await handle.read()
  return Session.fromRestore(id, read.events, handle.header, handle.inheritedEventCount, read.eventState)
}

function messages(session: Session) {
  return session.deriveMessages().map(({ role, content }) => ({ role, content }))
}

function prompt(text: string) {
  return { role: 'system', content: [{ type: 'text', text }] }
}
const human = { role: 'user', content: [{ type: 'text' as const, text: 'question' }] }

describe('system prompts through current Session and JSONL persistence', () => {
  it('persists current system appends after the protected head without converting them to user messages', async () => {
    const ctx = await mount()
    const session = Session.create(id)
    const writer = await ctx.sessionPersistence.create(session.header)
    try {
      session.append('turn/start', { turn: 1 })
      session.append('step/start', { turn: 1, step: 1 })
      session.append('system/message', {
        turn: 1, step: 1,
        message: freezeMessage({ role: 'system', id: MessageId('head'), content: [{ type: 'text', text: 'head prompt' }], source: { kind: 'system-prompt' } }),
      }, { surfaceOp: 'append' })
      session.append('user/message', freezeMessage({ role: 'user', id: MessageId('question'), content: human.content, source: { kind: 'user' } }), { surfaceOp: 'append' })
      session.append('system/message', {
        turn: 1, step: 1,
        message: freezeMessage({ role: 'system', id: MessageId('context'), content: [{ type: 'text', text: 'tail context' }], source: { kind: 'system-prompt' } }),
      }, { surfaceOp: 'append' })
      session.append('step/end', { turn: 1, step: 1 })
      session.append('turn/end', { turn: 1, reason: { kind: 'completed' } })
      await writer.append(session.snapshotEvents())
      await writer.flush()
    } finally {
      await writer.close()
    }
    const reopened = await mount()
    const reader = await reopened.sessionPersistence.open(id, 'read')
    try {
      expect((await reader.read()).events).toEqual(session.snapshotEvents())
      const restored = await restore(reader)
      expect(restored.surface.nodes).toEqual([2, 3, 4])
      expect(messages(restored)).toEqual([prompt('head prompt'), human, prompt('tail context')])
      expect(restored.deriveMessages().map(message => message.id)).toEqual(['head', 'question', 'context'])
    } finally {
      await reader.close()
    }
  })
})
