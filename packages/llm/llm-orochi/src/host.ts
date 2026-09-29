/** Shared Host wiring for the Orochi protocol adapter. */
import type { Context } from '@orochi-network/cordis'
import type {} from '@orochi-network/oh-settings'
import type {} from '@orochi-network/cordis-plugin-loader'
import type {} from '@orochi-network/oh-fs'
import { resolveImageAttachmentAccess } from '@orochi-network/oh-llm'
import { deepEqualJson } from '@orochi-network/oh-util-values'
import { OrochiAdapter } from './adapter.ts'
import type { OrochiAdapterOptions, OrochiConnectionOptions } from './types.ts'

/**
 * Register one provider with request-local transport services and live retry policy.
 * @param ctx - provider plugin lifetime with the LLM registry injected.
 * @param provider - exact route owned by this plugin.
 * @param dependencies - provider-owned discovery, credential, and configuration callbacks.
 */
export function registerOrochiProvider<C extends OrochiConnectionOptions>(
  ctx: Context, provider: string, dependencies: Pick<OrochiAdapterOptions<C>,
  'options' | 'resolveAuth' | 'providerName' | 'discoverModels'>): void {
  ctx.inject(['settings'], (child) => { child.effect(() => child.settings.configure({ auto: false }, ctx.fiber)) })
  const adapter = new OrochiAdapter({
    ...dependencies,
    onReplayDegrade: ({ provider, model, reason }) => {
      ctx.logger.warn(`llm-orochi: unusable Messages replay state on assistant history for route "${provider}/${model}"; sending provider-neutral content (${reason})`)
    },
    onExtensionsOmitted: ({ provider, model, fields, error }) => {
      ctx.logger.warn(`llm-orochi: sending route "${provider}/${model}" without request extension fields ${fields.join(', ')} because they failed to serialize: %o`, error)
    },
    resolveAttachments: () => ctx.get('attachments'),
    resolveImageAccess: (attachments, ref) => resolveImageAttachmentAccess(
      attachments, hostPath => ctx.get('fs')?.processPathFromHostPath(hostPath), ref,
    ),
    prepareExtensions: request => ctx.get('orochiLlmApiExtensions')?.prepare(request)
      ?? Promise.resolve({ fields: {}, accept: () => Promise.resolve() }),
  })
  const registration = ctx.llm.registerAdapter([provider], adapter)
  let registeredPolicy = dependencies.options().retryPolicy
  ctx.on('loader/volatile-update', () => {
    let policy: typeof registeredPolicy
    try { policy = dependencies.options().retryPolicy }
    catch (error) { ctx.logger.warn(error); return }
    if (deepEqualJson(policy, registeredPolicy)) return
    registration.replace([provider])
    registeredPolicy = policy
  })
}
