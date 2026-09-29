/**
 * Resolve the public SDK launch configuration to one oh subprocess.
 * @module @orochi-network/oh-sdk-client/launch
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { HarnessClientOptions } from './types.ts'

/** Default bound for a profile to answer the SDK initialize handshake. */
export const DEFAULT_INITIALIZE_TIMEOUT_MS = 10_000

/** Internal generic process launch used by the transport and fake-runtime tests. */
export interface RuntimeProcessOptions {
  command: string
  args: string[]
  cwd?: string
  /** Materialize the complete child environment when the client starts its subprocess. */
  environment: () => NodeJS.ProcessEnv
  description: string
  initializeTimeoutMs: number
  requestTimeoutMs?: number
  shutdownTimeoutMs?: number
  disposeEofGraceMs?: number
  disposeGraceMs?: number
}

/** Node argv plus internal profile patches required by one resolved oh entry. */
export interface OhNodeLaunch {
  /** Arguments before the profile selector. */
  nodeArgs: string[]
  /** Internal patches applied below caller-supplied patches. */
  patches: string[]
  /** Environment values required by the resolved entry mode. */
  environment: NodeJS.ProcessEnv
}

interface PackageManifest {
  version?: unknown
  bin?: unknown
}

/** Read a package manifest from one resolved package.json URL. */
function manifest(url: string): PackageManifest {
  return JSON.parse(readFileSync(fileURLToPath(url), 'utf8')) as PackageManifest
}

/**
 * Resolve and version-check a oh executable from package manifests.
 * @param ohManifestUrl - resolved URL of the oh package manifest.
 * @param clientManifestUrl - resolved URL of the SDK client manifest.
 * @returns the absolute oh executable path.
 */
export function resolveOhBinFromManifests(ohManifestUrl: string, clientManifestUrl: string): string {
  const ohManifest = manifest(ohManifestUrl)
  const clientManifest = manifest(clientManifestUrl)
  if (typeof ohManifest.version !== 'string' || ohManifest.version !== clientManifest.version) {
    throw new Error(`oh SDK client ${String(clientManifest.version)} requires the same oh version, got ${String(ohManifest.version)}`)
  }
  const bin = typeof ohManifest.bin === 'object' && ohManifest.bin !== null
    ? (ohManifest.bin as Record<string, unknown>).oh
    : ohManifest.bin
  if (typeof bin !== 'string' || bin === '') throw new Error('@orochi-network/oh declares no oh executable')
  return resolve(dirname(fileURLToPath(ohManifestUrl)), bin)
}

/**
 * Resolve and version-check the built oh executable installed with this SDK.
 * @returns the absolute built executable path, whether or not it exists in a source checkout.
 */
export function installedOhBin(): string {
  return resolveOhBinFromManifests(
    import.meta.resolve('@orochi-network/oh/package.json'),
    new URL('../package.json', import.meta.url).href,
  )
}

/**
 * Resolve the Node launch for one same-version oh package.
 * @param ohManifestUrl - resolved URL of the oh package manifest.
 * @param clientManifestUrl - resolved URL of the SDK client manifest.
 * @param sourceLoaderUrl - optional absolute tsx loader URL for deterministic tests.
 * @returns built output, or the source entry plus its compatibility patch and tsx environment.
 */
export function resolveOhNodeLaunchFromManifests(
  ohManifestUrl: string,
  clientManifestUrl: string,
  sourceLoaderUrl?: string,
): OhNodeLaunch {
  const bin = resolveOhBinFromManifests(ohManifestUrl, clientManifestUrl)
  if (existsSync(bin)) return { nodeArgs: [bin], patches: [], environment: {} }

  const packageDir = dirname(fileURLToPath(ohManifestUrl))
  const sourceBin = resolve(packageDir, 'src/bin.ts')
  const sourcePatch = resolve(packageDir, 'src/sdk-source.cordis.patch.yml')
  const sourceTsconfig = resolve(packageDir, 'tsconfig.json')
  if (!existsSync(sourceBin) || !existsSync(sourcePatch) || !existsSync(sourceTsconfig)) {
    throw new Error(
      `@orochi-network/oh is missing its built executable ${bin} and complete source launch files ${sourceBin}, ${sourcePatch}, ${sourceTsconfig}`,
    )
  }
  const loader = sourceLoaderUrl ?? import.meta.resolve('tsx/esm')
  return {
    nodeArgs: ['--import', loader, sourceBin],
    patches: [sourcePatch],
    environment: { TSX_TSCONFIG_PATH: sourceTsconfig },
  }
}

/**
 * Resolve the installed oh package to a built or source Node launch.
 * @returns the launch descriptor for the current checkout or installed package.
 */
function installedOhNodeLaunch(): OhNodeLaunch {
  return resolveOhNodeLaunchFromManifests(
    import.meta.resolve('@orochi-network/oh/package.json'),
    new URL('../package.json', import.meta.url).href,
  )
}

/**
 * Resolve caller-relative filesystem inputs and construct canonical oh argv.
 * @param options - public SDK launch options.
 * @param callerCwd - parent-process directory used for lexical resolution.
 * @returns one generic subprocess spec for the JSON-RPC transport.
 */
export function resolveOhLaunch(
  options: HarnessClientOptions = {},
  callerCwd: string = process.cwd(),
): RuntimeProcessOptions {
  const profile = options.profile ?? 'sdk'
  const ohLaunch = options.ohBin === undefined
    ? installedOhNodeLaunch()
    : { nodeArgs: [resolve(callerCwd, options.ohBin)], patches: [], environment: {} }
  const patches = [
    ...ohLaunch.patches,
    ...(options.patches ?? []).map(path => resolve(callerCwd, path)),
  ]
  const ohHome = options.ohHome === undefined ? undefined : resolve(callerCwd, options.ohHome)
  return {
    command: process.execPath,
    args: [...ohLaunch.nodeArgs, '--profile', profile, ...patches.flatMap(path => ['--patch', path])],
    ...options.processCwd === undefined ? {} : { cwd: resolve(callerCwd, options.processCwd) },
    environment: () => ({
      ...(options.env ?? process.env),
      ...ohLaunch.environment,
      ...ohHome === undefined ? {} : { OH_HOME: ohHome },
    }),
    description: `oh profile ${JSON.stringify(profile)}`,
    initializeTimeoutMs: options.initializeTimeoutMs ?? DEFAULT_INITIALIZE_TIMEOUT_MS,
    ...options.requestTimeoutMs === undefined ? {} : { requestTimeoutMs: options.requestTimeoutMs },
    ...options.shutdownTimeoutMs === undefined ? {} : { shutdownTimeoutMs: options.shutdownTimeoutMs },
    ...options.disposeEofGraceMs === undefined ? {} : { disposeEofGraceMs: options.disposeEofGraceMs },
    ...options.disposeGraceMs === undefined ? {} : { disposeGraceMs: options.disposeGraceMs },
  }
}
