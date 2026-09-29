/** Account-token authentication and discovery for the Orochi account route. */
import type {} from '@orochi-network/cordis-plugin-loader'
import type { Context } from '@orochi-network/cordis'
import { ACCOUNT_QUOTA_EXCEEDED_CODE, LlmError, QUOTA_EXCEEDED_CODE } from '@orochi-network/oh-llm'
import type {} from '@orochi-network/oh-orochi-account'
import { launchEnvironmentOf } from '@orochi-network/oh-launch-environment'
import { plainOptions, resolveAdapterOptions, registerOrochiProvider, catalogModelInfo } from '@orochi-network/oh-llm-orochi'
import type { OrochiRequestAuth, ResolvedOrochiOptions } from '@orochi-network/oh-llm-orochi'

import { Config } from './config.ts'
export { Config } from './config.ts'
export const name = 'llm-orochi-account'
export const inject = ['llm']

const PROVIDER = 'orochi-account'

export function apply(ctx: Context, config: Config): void {
  const options = () => resolveAdapterOptions(plainOptions(config), launchEnvironmentOf(ctx))
  options()
  const resolveAuth = async (connection: ResolvedOrochiOptions): Promise<OrochiRequestAuth> => {
    const account = ctx.get('orochiAccount')
    const token = await account?.resolveToken(connection.baseURL)
    if (token === undefined) throw new LlmError('Sign in to Orochi to use the account provider. The request destination must allow account authentication.', 'ACCOUNT_SIGN_IN_REQUIRED')
    return {
      headers: { 'x-oh-auth-token': token },
      onRequestError: async (error) => {
        if (!(error instanceof LlmError)) return error
        if (error.code === QUOTA_EXCEEDED_CODE) {
          return new LlmError(error.message, ACCOUNT_QUOTA_EXCEEDED_CODE, { ...error.failure, cause: error })
        }
        if (error.failure.status !== 401) return error
        const rejected = new LlmError(error.message, 'ACCOUNT_TOKEN_INVALID', { ...error.failure, cause: error })
        try { await account?.rejectToken(token) }
        catch (_credentialRemovalFailed) { /* Storage failure cannot replace the inference failure. */ }
        return rejected
      },
    }
  }
  ctx.llm.registerConfigurableProviders([
    { provider: PROVIDER, displayName: 'Orochi Account', settingsNs: ctx.fiber.entry?.options.id ?? name, settingsPath: [] },
  ])
  registerOrochiProvider(ctx, PROVIDER, {
    options, resolveAuth, providerName: 'Orochi Account',
    discoverModels: async (provider) => {
      const connection = options()
      try { await resolveAuth(connection) }
      catch (error) {
        if (error instanceof LlmError && error.code === 'ACCOUNT_SIGN_IN_REQUIRED') return []
        throw error
      }
      return connection.models.map(model => catalogModelInfo(provider, model))
    },
  })
}
