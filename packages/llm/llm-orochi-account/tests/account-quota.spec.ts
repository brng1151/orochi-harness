/** Account-route quota classification stays separate from API-key and third-party quota. */
import { Context } from '@orochi-network/cordis'
import { BlockAssembler, LlmRuntime } from '@orochi-network/oh-llm'
import type { OrochiAccount } from '@orochi-network/oh-orochi-account'
import * as ApiKey from '@orochi-network/oh-llm-orochi-api-key'
import { afterEach, expect, it, vi } from 'vitest'
import * as Account from '../src/index.ts'

const contexts: Context[] = []
afterEach(async () => {
  for (const ctx of contexts.splice(0)) await ctx.fiber.dispose()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

/** Drive one streamed request through the runtime and return its terminal failure. */
async function finishOf(ctx: Context, provider: string) {
  const assembler = new BlockAssembler()
  for await (const chunk of ctx.llm.stream({ provider, model: 'deepseek-flash', messages: [] })) assembler.push(chunk)
  return assembler.finish
}

/** Mount the shared runtime plus the one credential plugin that owns `provider`. */
async function routeFor(token: string | undefined, provider: 'orochi-account' | 'orochi-official'): Promise<Context> {
  const ctx = new Context()
  contexts.push(ctx)
  await ctx.plugin(LlmRuntime)
  ctx.provide('orochiAccount', {
    resolveToken: async (_baseURL: string): Promise<string | undefined> => token,
    rejectToken: async (_token: string): Promise<void> => {},
  } as OrochiAccount)
  await ctx.plugin(provider === 'orochi-account' ? Account : ApiKey)
  return ctx
}

it.each([
  { provider: 'orochi-account', apiKey: '', code: 'ACCOUNT_QUOTA' },
  { provider: 'orochi-account', apiKey: 'fixture-api-key', code: 'ACCOUNT_QUOTA' },
  { provider: 'orochi-official', apiKey: 'fixture-api-key', code: 'QUOTA' },
] as const)('reports a 402 balance rejection on $provider with apiKey "$apiKey" as $code', async ({ provider, apiKey, code }) => {
  vi.stubEnv('OROCHI_API_KEY', apiKey)
  const ctx = await routeFor('account-token', provider)
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
    error: { code: 'insufficient_balance', message: 'Insufficient balance' },
  }), { status: 402 }))
  await expect(finishOf(ctx, provider)).resolves.toMatchObject({ kind: 'error', failure: { code } })
})

it('reports an in-band account balance stream error as ACCOUNT_QUOTA', async () => {
  vi.stubEnv('OROCHI_API_KEY', 'fixture-api-key')
  const ctx = await routeFor('account-token', 'orochi-account')
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
    'event: error\ndata: {"type":"error","error":{"type":"invalid_request_error","code":"insufficient_balance","message":"Insufficient balance"}}\n\n',
    { status: 200 },
  ))
  await expect(finishOf(ctx, 'orochi-account')).resolves.toMatchObject({
    kind: 'error', failure: { code: 'ACCOUNT_QUOTA' },
  })
})

it('still expires the stored credential on an account-route 401', async () => {
  const ctx = new Context()
  contexts.push(ctx)
  await ctx.plugin(LlmRuntime)
  const rejectToken = vi.fn(async (_token: string): Promise<void> => {})
  ctx.provide('orochiAccount', {
    resolveToken: async (_baseURL: string): Promise<string | undefined> => 'account-token',
    rejectToken: (token: string): Promise<void> => rejectToken(token),
  } as OrochiAccount)
  await ctx.plugin(Account)
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Unauthorized', { status: 401 }))
  await expect(finishOf(ctx, 'orochi-account')).resolves.toMatchObject({
    kind: 'error', failure: { code: 'ACCOUNT_TOKEN_INVALID' },
  })
  expect(rejectToken.mock.calls).toEqual([['account-token']])
})
