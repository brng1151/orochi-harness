/** The configured model catalog is independent of request credentials. */
import { Context } from '@orochi-network/cordis'
import LlmRuntime from '@orochi-network/oh-llm'
import { expect, it, vi } from 'vitest'
import * as ApiKey from '../src/index.ts'

it.each(['', 'invalid\nheader'])('advertises configured models without a usable API key: %j', async (key) => {
  vi.stubEnv('OROCHI_API_KEY', key)
  const ctx = new Context()
  try {
    await ctx.plugin(LlmRuntime)
    await ctx.plugin(ApiKey, {})
    expect(await ctx.llm.listModels('orochi-official')).toEqual(expect.arrayContaining([
      expect.objectContaining({ provider: 'orochi-official', id: 'xiaomi/mimo-v2.6-flash' }),
    ]))
  } finally {
    await ctx.fiber.dispose()
    vi.unstubAllEnvs()
  }
})
