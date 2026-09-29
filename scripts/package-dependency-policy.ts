/** Explicit exceptions and Host packages for the published dependency policy. */

/** Packages treated as Client/Host packages without declaring `oh.client`. */
const CLIENT_FACE_INCLUDE: readonly string[] = []

/** Packages exempted from automatic Client/Host treatment despite declaring `oh.client`. */
const CLIENT_FACE_EXCLUDE: readonly string[] = [
  '@orochi-network/oh-api-session-controller',
  '@orochi-network/oh-api-workspace-controller',
]

/** Host-only packages whose peer relays are deliberately flattened. */
const HOST_DEPENDENCY_PACKAGES: readonly string[] = [
  '@orochi-network/oh-llm',
  '@orochi-network/oh-session',
]

/** Development-only package relationships not represented by source imports. */
const CONFIGURATION_ONLY_DEV_DEPENDENCIES = {
  '@orochi-network/oh-client-locale': ['@orochi-network/oh-api-remotes'],
  '@orochi-network/oh-client-ui-conversation': [
    '@orochi-network/oh-api-remotes',
    '@orochi-network/oh-client-ui-workspace',
  ],
  '@orochi-network/oh-client-ui-model-selection': ['@orochi-network/oh-client-ui-input-trigger'],
  '@orochi-network/oh-client-ui-sidebar': ['@orochi-network/oh-client-ui-workspace'],
  '@orochi-network/oh-client-ui-subagent': ['@orochi-network/oh-client-ui-input-trigger'],
  '@orochi-network/oh-client-ui-theme': ['@orochi-network/oh-api-remotes'],
  '@orochi-network/oh-client-ui-tool': ['@orochi-network/oh-api-remotes'],
} as const satisfies Readonly<Record<string, readonly string[]>>

/** Workspace packages whose complete runtime surface is safe across duplicate installations. */
const DUPLICATE_SAFE_PACKAGES: readonly string[] = [
  '@orochi-network/oh-brand',
  '@orochi-network/oh-lazy-require',
  '@orochi-network/oh-typert-protocol',
  '@orochi-network/oh-util-code-language',
  '@orochi-network/oh-util-crypto',
  '@orochi-network/oh-util-values',
]

/**
 * Runtime exports whose values remain valid when npm installs another package copy.
 * New entries are forbidden by default. Automated agents must not add an
 * exception; every addition requires explicit human review and a dedicated,
 * prominent heading in the pull request description.
 */
const SAFE_HOST_DEPENDENCY_EXPORTS = {
  '@orochi-network/oh-credentials': ['credentialKey'],
  '@orochi-network/oh-deque': ['Deque'],
  '@orochi-network/oh-llm': ['callConfigEquals'],
  '@orochi-network/oh-session-format': ['sessionFormatLogFilename'],
  '@orochi-network/oh-timeout': ['MAX_TIMER_DELAY_MS'],
  '@orochi-network/schemastery': ['default'],
} as const satisfies HostDependencyExports

/** Runtime exports that require every consumer to resolve the provider's shared peer instance. */
const PEER_REQUIRED_HOST_EXPORTS = {
  '@orochi-network/oh-client-connection': ['OperatorPeer'],
  '@orochi-network/oh-subprocess': ['SubprocessExecutableNotFoundError'],
  '@orochi-network/oh-scope': ['carrierKeyOf', 'createScope', 'scopeOf', 'scopeTarget'],
  '@orochi-network/oh-session': ['SESSION_FORMAT_VERSION'],
  '@orochi-network/oh-session-persistence': ['SessionPersistenceNotFoundError'],
} as const satisfies HostDependencyExports

/** Exact import specifier to reviewed runtime exports. */
type HostDependencyExports = Readonly<Record<string, readonly string[]>>

/** Complete configurable input to package dependency classification. */
export interface PackageDependencyPolicy {
  readonly clientFaceInclude: readonly string[]
  readonly clientFaceExclude: readonly string[]
  readonly hostPackages: readonly string[]
  readonly configurationOnlyDevDependencies: Readonly<Record<string, readonly string[]>>
  readonly duplicateSafePackages?: readonly string[]
  readonly safeHostDependencyExports: HostDependencyExports
  readonly peerRequiredHostExports: HostDependencyExports
}

/** Repository dependency policy consumed by verification and benchmarking. */
export const PACKAGE_DEPENDENCY_POLICY: PackageDependencyPolicy = {
  clientFaceInclude: CLIENT_FACE_INCLUDE,
  clientFaceExclude: CLIENT_FACE_EXCLUDE,
  hostPackages: HOST_DEPENDENCY_PACKAGES,
  configurationOnlyDevDependencies: CONFIGURATION_ONLY_DEV_DEPENDENCIES,
  duplicateSafePackages: DUPLICATE_SAFE_PACKAGES,
  safeHostDependencyExports: SAFE_HOST_DEPENDENCY_EXPORTS,
  peerRequiredHostExports: PEER_REQUIRED_HOST_EXPORTS,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Whether a package manifest declares a dynamically loaded Client entry. */
export function hasClientDeclaration(ohField: unknown): boolean {
  return isRecord(ohField) && Object.hasOwn(ohField, 'client')
}

/** Whether the repository policy flattens one package's non-Cordis peers. */
export function usesFlattenedPackageDependencies(
  manifestPath: string,
  packageName: string,
  ohField: unknown,
  policy: PackageDependencyPolicy = PACKAGE_DEPENDENCY_POLICY,
): boolean {
  if (!manifestPath.startsWith('packages/') || manifestPath.startsWith('packages/experimental/')) return false
  if (policy.hostPackages.includes(packageName)) return true
  if (manifestPath.startsWith('packages/client/')) return true
  const included = hasClientDeclaration(ohField) || policy.clientFaceInclude.includes(packageName)
  return included && !policy.clientFaceExclude.includes(packageName)
}
