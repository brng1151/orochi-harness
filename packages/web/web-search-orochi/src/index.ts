/**
 * Register a Orochi-backed provider in `ctx.web`. It calls the Anthropic-compatible Messages API
 * with native `web_search_20250305`, authenticating with `OROCHI_API_KEY`. The provider does not
 * reuse `OROCHI_BASE_URL`; auxiliary search has its own endpoint configuration.
 * @module @orochi-network/oh-web-search-orochi
 */
import type { Volatile } from '@orochi-network/cordis'

import type { Context } from '@orochi-network/cordis'
import z from '@orochi-network/schemastery'
import type {} from '@orochi-network/oh-agent'
import { credentialRef } from '@orochi-network/oh-credentials'
import { launchEnvironmentOf } from '@orochi-network/oh-launch-environment'
import type {} from '@orochi-network/oh-session'
import type {} from '@orochi-network/oh-web'
import {
  OrochiSearchProvider,
  OROCHI_DEFAULT_API_VERSION,
  OROCHI_DEFAULT_BASE_URL,
  OROCHI_DEFAULT_MAX_TOKENS,
  OROCHI_DEFAULT_MAX_USES,
  OROCHI_DEFAULT_MODEL,
} from './provider.ts'
import type { OrochiSearchProviderOptions } from './provider.ts'

export {
  OrochiSearchProvider,
  OROCHI_DEFAULT_API_VERSION,
  OROCHI_DEFAULT_BASE_URL,
  OROCHI_DEFAULT_MAX_TOKENS,
  OROCHI_DEFAULT_MAX_USES,
  OROCHI_DEFAULT_MODEL,
  OROCHI_PROVIDER_ID,
} from './provider.ts'
export type { OrochiSearchLlmRequest, OrochiSearchProviderOptions } from './provider.ts'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'web-search-orochi'

/** The web seam this provider registers into. */
export const inject = ['web']

const DEFAULT_API_KEY_ENV = 'OROCHI_API_KEY'

/** Plugin config (all optional — `apply` fills env-var and constant defaults). */
export interface Config {
  /** Literal Orochi API key; prefer {@link apiKeyEnv} so no secret enters configuration files. */
  apiKey: Volatile<string | undefined>
  /** Credential reference resolved for each search; defaults to `OROCHI_API_KEY`. */
  apiKeyEnv: Volatile<string>
  /** Anthropic-compatible endpoint base; `/messages` is appended. */
  baseURL: Volatile<string | undefined>
  /** Anthropic-format model name. Defaults to `xiaomi/mimo-v2.6-flash`. */
  model: Volatile<string>
  /** `anthropic-version` header value. Defaults to `2023-06-01`. */
  apiVersion: Volatile<string>
  /** Upper bound on generated tokens for the Messages request. Defaults to 4096. */
  maxTokens: Volatile<number>
  /** Maximum `web_search` server-tool uses per request. Defaults to 5. */
  maxUses: Volatile<number>
}

export const Config = z.object({
  apiKey: z.string().role('secret').volatile(),
  apiKeyEnv: z.string().role('credential-ref').default(DEFAULT_API_KEY_ENV).volatile(),
  // Declared here rather than only at the use site: a configuration surface
  // renders the resolved section, so a default the schema does not carry reads
  // there as no value at all.
  baseURL: z.string().volatile(),
  model: z.string().default(OROCHI_DEFAULT_MODEL).volatile(),
  apiVersion: z.string().default(OROCHI_DEFAULT_API_VERSION).volatile(),
  maxTokens: z.number().step(1).min(1).default(OROCHI_DEFAULT_MAX_TOKENS).volatile(),
  maxUses: z.number().step(1).min(1).default(OROCHI_DEFAULT_MAX_USES).volatile(),
})

/**
 * Auxiliary-search endpoint, independent of the conversation adapter's
 * `$OROCHI_BASE_URL` and selected protocol.
 */
const SEARCH_BASE_URL_ENV = 'OROCHI_SEARCH_BASE_URL'

/** Settings namespace carrying this provider's endpoint, model, and key reference. */
export const WEB_SEARCH_OROCHI_SETTINGS_NAMESPACE = 'web-search-orochi'

/**
 * Project one resolved section into the options the provider serves its next
 * search with. Environment fallbacks stay here rather than in the provider:
 * every value it reads is already fully defaulted.
 * @param ctx - plugin context supplying the credential and environment planes.
 * @param config - the currently authoritative section.
 * @returns options for one search.
 */
function resolveOptions(
  ctx: Context, config: { [K in keyof Config]: ReturnType<Config[K]['get']> },
): OrochiSearchProviderOptions {
  const apiKeyEnv = credentialRef(config.apiKeyEnv)
  const literalApiKey = config.apiKey !== undefined && config.apiKey.length > 0
    ? config.apiKey
    : undefined
  return {
    ...literalApiKey === undefined ? {} : { apiKey: literalApiKey },
    resolveApiKey: async () => {
      const credentials = ctx.get('credentials')
      if (credentials !== undefined) return (await credentials.resolve(apiKeyEnv))?.value
      // Without the seam the environment is the whole credential plane.
      const ambient = launchEnvironmentOf(ctx).get(apiKeyEnv)
      return ambient !== undefined && ambient.value.length > 0 ? ambient.value : undefined
    },
    apiKeyEnv,
    baseURL: config.baseURL
      ?? launchEnvironmentOf(ctx).get(SEARCH_BASE_URL_ENV)?.value
      ?? OROCHI_DEFAULT_BASE_URL,
    model: config.model,
    apiVersion: config.apiVersion,
    maxTokens: config.maxTokens,
    maxUses: config.maxUses,
    recordRequest: (request) => {
      ctx.get('agents')?.currentInitiator()?.session.append(
        'web/deepseek-search-llm-request',
        request,
      )
    },
  }
}

/** Register the Orochi search provider with `ctx.web`. */
export function apply(ctx: Context, config: Config): void {
  ctx.web.registerSearchProvider(new OrochiSearchProvider(() => resolveOptions(ctx, {
    apiKey: config.apiKey.get(), apiKeyEnv: config.apiKeyEnv.get(), baseURL: config.baseURL.get(), model: config.model.get(),
    apiVersion: config.apiVersion.get(), maxTokens: config.maxTokens.get(), maxUses: config.maxUses.get(),
  })))
}
