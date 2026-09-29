/** API-key authentication and discovery for the official Orochi route. */
import type { Context } from '@orochi-network/cordis'
import { assertUsableApiKey, LlmError } from '@orochi-network/oh-llm'
import type {} from '@orochi-network/cordis-plugin-loader'
import { launchEnvironmentOf } from '@orochi-network/oh-launch-environment'
import { registerOrochiProvider, catalogModelInfo } from '@orochi-network/oh-llm-orochi'
import { Config, plainOptions, resolveAdapterOptions } from './config.ts'
import type { ResolvedOrochiOptions } from './config.ts'

export { Config, plainOptions, resolveAdapterOptions } from './config.ts'
export type { Options, ResolvedOrochiOptions } from './config.ts'
export const name = 'llm-orochi-api-key'
export const inject = ['llm']

const PROVIDER = 'orochi-official'

export function apply(ctx: Context, config: Config): void {
  const options = () => resolveAdapterOptions(plainOptions(config), launchEnvironmentOf(ctx))
  options()
  const resolveApiKey = async (connection: ResolvedOrochiOptions): Promise<string> => {
    const ref = connection.apiKeyEnv
    const credentials = ctx.get('credentials')
    if (credentials !== undefined) {
      const hit = await credentials.resolve(ref)
      if (hit !== undefined) return assertUsableApiKey(hit.value, 'llm-orochi', ref)
    } else {
      const ambient = launchEnvironmentOf(ctx).get(ref)
      if (ambient !== undefined && ambient.value.length > 0) return assertUsableApiKey(ambient.value, 'llm-orochi', ref)
    }
    throw new LlmError(
      `llm-orochi: no API key for provider route "${PROVIDER}"; store ${ref} through the credentials`
      + ` service (the web Models page writes it), or export ${ref} in the launching environment`,
      'MISSING_CREDENTIAL',
    )
  }
  ctx.llm.registerConfigurableProviders([
    { provider: PROVIDER, displayName: 'Orochi', settingsNs: ctx.fiber.entry?.options.id ?? name, settingsPath: [] },
  ])
  registerOrochiProvider(ctx, PROVIDER, {
    options, providerName: 'Orochi',
    resolveAuth: async connection => ({ headers: { 'x-api-key': await resolveApiKey(connection) } }),
    discoverModels: (provider) => {
      const connection = options()
      return Promise.resolve(connection.models.map(model => catalogModelInfo(provider, model)))
    },
  })
}
