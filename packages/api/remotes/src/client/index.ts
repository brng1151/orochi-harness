/** Platform-neutral assembly of generated Host Remote contributions. */

import type { Context } from '@orochi-network/cordis'
import agentPresetsRemote from '@orochi-network/oh-agent-preset-registry/remote'
import commandsRemote from '@orochi-network/oh-commands/remote'
import accountRemote from '@orochi-network/oh-api-account-controller/remote'
import settingsControllerRemote from '@orochi-network/oh-api-settings-controller/remote'
import officeToPdfRemote from '@orochi-network/oh-office-to-pdf/remote'
import goalsRemote from '@orochi-network/oh-goal/remote'
import scheduleRemote from '@orochi-network/oh-schedule/remote'
import llmRemote from '@orochi-network/oh-llm/remote'
import dynamicRemote from '@orochi-network/oh-cordis-host-runner/remote'
import pluginManagerRemote from '@orochi-network/oh-plugin-manager/remote'
import pluginRegistryProbeRemote from '@orochi-network/oh-client-ui-plugin-manager/remote'
import pluginInventoryRemote from '@orochi-network/oh-host-plugin-inventory/remote'
import messageFeedbackRemote from '@orochi-network/oh-message-feedback/remote'
import permissionPresetsRemote from '@orochi-network/oh-permission-presets/remote'
import sessionFeedbackRemote from '@orochi-network/oh-command-feedback/remote'
import fileUploadsRemote from '@orochi-network/oh-client-file-upload/remote'
import sessionReferencesRemote from '@orochi-network/oh-session-reference/remote'
import subagentsRemote from '@orochi-network/oh-subagent/remote'
import sessionRemote from '@orochi-network/oh-api-session-controller/remote'
import jobRemote from '@orochi-network/oh-api-job-controller/remote'
import workspaceRemote from '@orochi-network/oh-api-workspace-controller/remote'
import terminalRemote from '@orochi-network/oh-api-terminal-controller/remote'
import workspaceFilesRemote from '@orochi-network/oh-api-workspace-files/remote'
import type { ClientRemote } from '@orochi-network/oh-api-gateway/client'

export type { ClientRemote } from '@orochi-network/oh-api-gateway/client'
export type {
  BundleInfo, BundleRowInfo, ChangeResult, IncompatiblePlugin, InspectOptions, InstallBundleOptions, InstallSpecKind, ManagementError,
  PackageResult,
  PluginChange, PluginEntryId, PluginInfo, PluginInspectProblem, PluginInstallCancellation, PluginInstallFailureKind,
  PluginInstallLogChunk, PluginInstallProgress, PluginInstallRequestId, PluginRegistries, PluginSpecInspection, ReadOnlyReason, Registry,
} from '@orochi-network/oh-plugin-manager/types'
export type {} from '@orochi-network/oh-plugin-manager/remote'
export type {} from '@orochi-network/oh-client-ui-plugin-manager/remote'
export type { PluginInventorySnapshot } from '@orochi-network/oh-host-plugin-inventory/types'
export type {} from '@orochi-network/oh-agent-preset-registry/remote'
export type {} from '@orochi-network/oh-commands/remote'
export type {} from '@orochi-network/oh-api-settings-controller/remote'
export type {} from '@orochi-network/oh-api-account-controller/remote'
export type {} from '@orochi-network/oh-goal/remote'
export type {} from '@orochi-network/oh-schedule/remote'
export type {} from '@orochi-network/oh-office-to-pdf/remote'
export type {} from '@orochi-network/oh-llm/remote'
export type {} from '@orochi-network/oh-host-plugin-inventory/remote'
export type {} from '@orochi-network/oh-message-feedback/remote'
export type {} from '@orochi-network/oh-permission-presets/remote'
export type {} from '@orochi-network/oh-command-feedback/remote'
export type {} from '@orochi-network/oh-client-file-upload/remote'
export type {} from '@orochi-network/oh-session-reference/remote'
export type {} from '@orochi-network/oh-subagent/remote'
export type * from '@orochi-network/oh-subagent/client'
export type {} from '@orochi-network/oh-api-session-controller/remote'
export type * from '@orochi-network/oh-api-session-controller/types'
export type {} from '@orochi-network/oh-api-job-controller/remote'
export type * from '@orochi-network/oh-api-job-controller/types'
export type {} from '@orochi-network/oh-api-workspace-controller/remote'
export type * from '@orochi-network/oh-api-workspace-controller/types'
export type {} from '@orochi-network/oh-api-workspace-files/remote'
export type * from '@orochi-network/oh-api-workspace-files/types'
export type {} from '@orochi-network/oh-api-terminal-controller/remote'
export type * from '@orochi-network/oh-api-terminal-controller/types'
// The forwarded-event allowlist's selection seat: without it in the consumer's
// compilation face `TypertRemoteEvent` is `never` and every `$on` call fails.
export type { ApiRemoteForwardedEvent } from '../types.ts'
// The owner packages' client-safe `./types` exports supply the `Events`
// signatures `$on` hands to a listener, so a consumer reads the very
// declaration the Host emits rather than a flattened restatement of it.
export type {} from '@orochi-network/oh-commands/types'
export type {} from '@orochi-network/oh-cordis-host-runner/types'
export type {} from '@orochi-network/oh-credentials/types'
export type {} from '@orochi-network/oh-llm/types'
export type {} from '@orochi-network/oh-agent-preset-registry/types'
export type {} from '@orochi-network/oh-permission-presets/types'
export type {} from '@orochi-network/oh-settings/types'
export type {} from '@orochi-network/oh-user-approval/types'
export type {} from '@orochi-network/oh-user-questions/types'
export type {} from '@orochi-network/oh-api-session-controller/types'

/**
 * The carrier's Client-facing types, re-exported so a business package names one
 * assembly package instead of both this facade and the Connection plugin. Type-only:
 * the carrier's runtime values stay behind their own module edge.
 */
export type {
  ConnectionHandle, ConnectionSinks, ContentBlock,
  MessageId,
  RpcId, RpcRequest, RpcResponse, RpcResult, SessionId,
  StreamChunk,
} from '@orochi-network/oh-client-connection/client'
export type {} from '@orochi-network/oh-api-gateway/client'
export type {} from '@orochi-network/oh-cordis-host-runner/remote'

// The payload vocabulary of the selected namespaces, re-exported so a Client
// contribution can name what it sends and receives without importing a Host
// package: this assembly is the one place both planes legitimately meet.
export type {
  ApprovalRequestId,
  CordisHalfState,
  CordisDynamicPackageId,
  CordisDynamicPluginId,
  CordisDynamicPluginRunId,
  CordisDynamicRunMode,
  CordisInspectMethodManifest,
  CordisInspectPlatform,
  CordisInspectProviderManifest,
  CordisInspectProviderView,
  CordisInspectQueryRequest,
  CordisInspectQueryResolution,
  CordisInspectQueryResolved,
  CordisInspectRequestId,
  CordisInspectResolveAck,
  CordisRunDiagnostic,
  CordisRunStatus,
  DynamicCordisClientSource,
  DynamicCordisHostHalfResult,
  DynamicCordisInventoryRow,
  DynamicCordisInvokeResult,
  DynamicCordisPackage,
  DynamicCordisRequestResolved,
  DynamicCordisResolveAck,
  DynamicCordisRetracted,
  DynamicCordisRunRequest,
  DynamicCordisRunResolution,
  DynamicCordisRunAttempt,
  DynamicCordisRunResponse,
  DynamicCordisStopResponse,
  DynamicCordisUndefineReceipt,
  RequestRunOutcome,
} from '@orochi-network/oh-cordis-host-runner/types'
// Credential state vocabulary for the credentials namespace (values never ride it).
export type { CredentialInfo } from '@orochi-network/oh-credentials/types'
// Redacted namespace vocabulary for the settings namespace (secrets never ride
// it). It travels with its seam, whose `./types` the Client face already reads.
export type {
  SettingsDescribeValue, SettingsNamespaceView, SettingsPathOpView, SettingsSecretView,
} from '@orochi-network/oh-settings/types'
// Provider registry and discovery vocabulary for the llm namespace.
export type {
  LlmConfigurableProvider, LlmDiscoveredModel,
  LlmModelDiscoveryRequest, LlmProviderInfo,
} from '@orochi-network/oh-llm/types'
// Reference-discovery result vocabulary for the fileReferences and
// sessionReferenceResolver namespaces.
export type { FileReferenceCandidate } from '@orochi-network/oh-file-reference/types'
export type { SessionReferenceMentionCandidate } from '@orochi-network/oh-session-reference/types'

// The Remote failure vocabulary, re-exported so business packages keep naming
// this assembly alone. Types only: a value export would make spec imports load
// this module's owner /remote artifacts; specs take RemoteError from
// oh-client-test-runtime instead.
export type {
  RemoteErrorCode, RemoteErrorDetailsMap, RemoteFailure, RemoteResult,
} from '@orochi-network/oh-typert-protocol'
export type { RemoteHostFacts } from '@orochi-network/oh-api-gateway/client'

declare module '@orochi-network/cordis' {
  interface Context {
    /** Generated Remote namespaces selected by this Client assembly. */
    remote: ClientRemote
  }
}

/** Required service: the typed Client Remote contribution mount. */
export const inject = ['remote']

/**
 * Mount the Host capabilities explicitly selected for this Client assembly.
 * @param ctx - Client Cordis root carrying the typed API service.
 * @returns disposer after every selected Remote namespace is ready.
 */
export async function apply(ctx: Context): Promise<() => Promise<void>> {
  const disposers: Array<() => Promise<void>> = []
  try {
    for (const contribution of [
      agentPresetsRemote, commandsRemote, settingsControllerRemote, accountRemote,
      goalsRemote, llmRemote, dynamicRemote, scheduleRemote,
      pluginInventoryRemote, pluginManagerRemote, pluginRegistryProbeRemote, messageFeedbackRemote, sessionFeedbackRemote,
      fileUploadsRemote, sessionReferencesRemote,
      permissionPresetsRemote, subagentsRemote, sessionRemote, jobRemote, workspaceRemote, workspaceFilesRemote, terminalRemote,
      officeToPdfRemote,
    ]) {
      disposers.push(await ctx.remote.$mount(contribution))
    }
  } catch (error) {
    for (const dispose of disposers.reverse()) await dispose()
    throw error
  }
  // Unwound in reverse mount order, so a namespace never outlives one mounted
  // after it.
  return async () => {
    for (const dispose of disposers.reverse()) await dispose()
  }
}
