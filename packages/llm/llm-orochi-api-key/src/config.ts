/** API-key configuration resolved together with one Messages endpoint generation. */
import type { Volatile } from '@orochi-network/cordis'
import z from '@orochi-network/schemastery'
import { credentialRef, type CredentialRef } from '@orochi-network/oh-credentials'
import type { LaunchEnvironmentSnapshot } from '@orochi-network/oh-launch-environment'
import { orochiConfigFields, type Config as ProtocolConfig, plainOptions as protocolOptions, resolveAdapterOptions as resolveProtocolOptions } from '@orochi-network/oh-llm-orochi'
import type { Options as ProtocolOptions, OrochiConnectionOptions } from '@orochi-network/oh-llm-orochi'

/** Messages configuration with a per-request API-key reference. */
export interface Config extends ProtocolConfig {
  /** Credential reference resolved per request; defaults to OROCHI_API_KEY. */
  apiKeyEnv: Volatile<string>
}
export const Config = z.object({
  ...orochiConfigFields,
  apiKeyEnv: z.string().role('credential-ref').default('OROCHI_API_KEY').volatile(),
})
/** Plain deployment inputs for the API-key provider. */
export type Options = ProtocolOptions & { apiKeyEnv?: string }
/** Endpoint and credential reference captured from the same configuration generation. */
export interface ResolvedOrochiOptions extends OrochiConnectionOptions {
  /** Credential reference used only for this connection snapshot. */
  apiKeyEnv: CredentialRef
}
/** Read one validated provider configuration.
 * @param config - live plugin configuration.
 * @returns detached resolver inputs.
 */
export function plainOptions(config: Config): Options {
  return { ...protocolOptions(config), apiKeyEnv: config.apiKeyEnv.get() }
}
/** Resolve API-key and protocol settings together.
 * @param config - raw deployment settings.
 * @param environment - application launch environment.
 * @returns validated endpoint facts and the matching credential reference.
 */
export function resolveAdapterOptions(config: Options, environment?: LaunchEnvironmentSnapshot): ResolvedOrochiOptions {
  return { ...resolveProtocolOptions(config, environment), apiKeyEnv: credentialRef(config.apiKeyEnv ?? 'OROCHI_API_KEY') }
}
