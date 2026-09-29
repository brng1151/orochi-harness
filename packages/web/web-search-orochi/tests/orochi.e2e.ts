import { describe, expect, it } from 'vitest'
import {
  OrochiSearchProvider,
  OROCHI_DEFAULT_API_VERSION,
  OROCHI_DEFAULT_BASE_URL,
  OROCHI_DEFAULT_MAX_TOKENS,
  OROCHI_DEFAULT_MAX_USES,
  OROCHI_DEFAULT_MODEL,
} from '@orochi-network/oh-web-search-orochi'

/** Construct the provider over a fixed options value; production passes a live thunk. */
import type { OrochiSearchProviderOptions } from '@orochi-network/oh-web-search-orochi'

const searchProvider = (options: OrochiSearchProviderOptions): OrochiSearchProvider =>
  new OrochiSearchProvider(() => options)

/**
 * Disabled real-API probe for the Orochi search provider. The live endpoint
 * can complete without structured source blocks, so this is not a reliable
 * merge signal. Its body remains because mocks cannot confirm the wire shape.
 */
const apiKey = process.env.OROCHI_API_KEY
const maybe = apiKey !== undefined && apiKey.length > 0 ? describe : describe.skip

maybe('OrochiSearchProvider real API', () => {
  it.skip('returns citeable sources for a live query via native web_search', async () => {
    const provider = searchProvider({
      apiKey: apiKey!,
      baseURL: process.env.OROCHI_SEARCH_BASE_URL ?? OROCHI_DEFAULT_BASE_URL,
      model: process.env.OROCHI_SEARCH_MODEL ?? OROCHI_DEFAULT_MODEL,
      apiVersion: OROCHI_DEFAULT_API_VERSION,
      maxTokens: OROCHI_DEFAULT_MAX_TOKENS,
      maxUses: OROCHI_DEFAULT_MAX_USES,
    })
    const result = await provider.search({ query: 'What is Orochi Harness?', maxResults: 5 })
    expect(result.sources.length).toBeGreaterThan(0)
    for (const source of result.sources) expect(source.url).toMatch(/^https?:\/\//)
  }, 60_000)
})
