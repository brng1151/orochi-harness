import { createUserMessage } from '@orochi-network/oh-llm'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@orochi-network/cordis'
import LlmRuntime from '@orochi-network/oh-llm'
import * as LlmOrochi from '@orochi-network/oh-llm-orochi-api-key'
import SessionStore, { SessionId } from '@orochi-network/oh-session'
import SessionTitleService from '@orochi-network/oh-session-title'
import SessionProjectionRegistry from '@orochi-network/oh-session-projection'
import * as FirstMessageTitleProvider from '@orochi-network/oh-session-title-first-prompt-llm'

const contexts: Context[] = []

afterEach(async () => {
  await Promise.all(contexts.splice(0).map(ctx => ctx.fiber.dispose()))
})

describe.skipIf(!process.env.OROCHI_API_KEY)('first-prompt title provider with real Orochi API', () => {
  it('replaces the fallback with a short model title', async () => {
    const ctx = new Context()
    contexts.push(ctx)
    await ctx.plugin(LlmRuntime)
    await ctx.plugin(LlmOrochi, { thinking: 'disabled' })
    await ctx.plugin(SessionStore)
    await ctx.plugin(SessionProjectionRegistry)
    await ctx.plugin(SessionTitleService, {
      fallbackMaxWords: 5,
      fallbackMaxBytes: 40,
      maxTitleBytes: 80,
    })
    await ctx.plugin(FirstMessageTitleProvider, {
      targetWords: 5,
      targetCjkCharacters: 10,
      maxInputBytes: 4_096,
      maxOutputTokens: 64,
      timeoutMs: 60_000,
      provider: 'orochi-official',
      model: 'deepseek-v4-flash',
    })
    const session = ctx.sessions.create(SessionId('real-title-provider'))
    session.append('turn/start', {
      turn: 1,
    })
    const message = session.append('user/message', createUserMessage({
      content: [{ type: 'text', text: 'Explain why append-only logs make session titles durable.' }],
      source: { kind: 'user' },
    }), { surfaceOp: 'append' })

    const title = await ctx.sessionTitle.refresh(session)

    expect(title).toMatchObject({
      messageSeqs: [message.seq],
      source: {
        kind: 'provider',
        provider: 'session-title-first-prompt-llm',
        model: { provider: 'orochi-official', model: 'deepseek-v4-flash' },
      },
    })
    expect(title?.title.length).toBeGreaterThan(0)
    expect(Buffer.byteLength(title?.title ?? '', 'utf8')).toBeLessThanOrEqual(80)
  })
})
