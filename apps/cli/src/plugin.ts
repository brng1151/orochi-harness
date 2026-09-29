/** Profile package management and explicit, exact-version compatibility approvals. */
import { runPluginCommand, setProfileVersionExemption } from '@orochi-network/oh-plugin-manager/operations'
import { INSTALL_ANCHOR } from './profile-boot.ts'
import { DEFAULT_PROFILE_BUNDLES, initProfile, PROFILE_TEMPLATES, readProfileCompatibility, resolveProfileDir } from '@orochi-network/oh-app-boot'
import { withFileLock } from '@orochi-network/oh-atomic-write'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

/** Parse only OH-owned commands; all other arguments remain pnpm's responsibility. */
async function versionCommand(profile: string, args: readonly string[]): Promise<number | undefined> {
  const [command, ...rest] = args
  if (command !== 'allow-version' && command !== 'revoke-version' && command !== 'version-exemptions') return undefined
  try {
    let packageVersion: string | undefined
    let runtimeVersion: string | undefined
    let acceptRisk = false
    const argumentsIterator = rest.values()
    for (const argument of argumentsIterator) {
      if (argument === '--accept-risk' && command === 'allow-version' && !acceptRisk) acceptRisk = true
      else if (argument === '--oh-version' && runtimeVersion === undefined) runtimeVersion = argumentsIterator.next().value
      else if (argument.startsWith('--oh-version=') && runtimeVersion === undefined) runtimeVersion = argument.slice('--oh-version='.length)
      else if (!argument.startsWith('-') && packageVersion === undefined) packageVersion = argument
      else throw new Error(`unexpected argument ${JSON.stringify(argument)}`)
    }
    if (command === 'version-exemptions' && rest.length > 0) throw new Error('usage: oh plugin version-exemptions')
    let request: { packageVersion: string; runtimeVersion: string } | undefined
    if (command !== 'version-exemptions') {
      if (packageVersion === undefined || runtimeVersion === undefined) {
        throw new Error(`usage: oh plugin ${command} <package@version> --oh-version <exact>${command === 'allow-version' ? ' --accept-risk' : ''}`)
      }
      request = { packageVersion, runtimeVersion }
    }
    if (command === 'allow-version') {
      process.stderr.write('oh: warning: allowing incompatible plugin versions can break the application or corrupt data. Approval applies only to the exact package and OH versions.\n')
    }
    const dir = resolveProfileDir(profile)
    await mkdir(dir, { recursive: true })
    await withFileLock(join(dir, 'package.json'), async () => {
      if (!existsSync(join(dir, 'package.json'))) initProfile(dir, PROFILE_TEMPLATES[profile]?.bundles ?? DEFAULT_PROFILE_BUNDLES)
      if (request === undefined) {
        const { exemptions, warnings } = readProfileCompatibility(dir)
        for (const warning of warnings) process.stderr.write(`oh: warning: ${warning}\n`)
        process.stdout.write(JSON.stringify(exemptions, undefined, 2) + '\n')
      } else {
        await setProfileVersionExemption(dir, request.packageVersion, request.runtimeVersion, command === 'allow-version', acceptRisk)
        process.stdout.write(`oh: ${command === 'allow-version' ? 'allowed' : 'revoked'} ${request.packageVersion} for OH ${request.runtimeVersion}\n`)
      }
    }, { waitMs: 120000 })
    return 0
  } catch (error) {
    process.stderr.write(`oh: ${String(error)}\n`)
    return 1
  }
}

/** Run package management for a profile.
 * @param profile Profile name.
 * @param args OH exemption command or pnpm arguments relative to the invoking directory.
 * @returns Zero on success; nonzero on invalid approval or package-manager failure.
 */
export async function runPlugin(profile: string, args: readonly string[]): Promise<number> {
  const versionResult = await versionCommand(profile, args)
  if (versionResult !== undefined) return versionResult
  const dir = resolveProfileDir(profile)
  if (existsSync(join(dir, 'package.json'))) {
    for (const warning of readProfileCompatibility(dir).warnings) process.stderr.write(`oh: warning: ${warning}\n`)
  }
  const result = await runPluginCommand({ profile, installAnchor: INSTALL_ANCHOR, cwd: process.cwd() }, args, {
    execution: 'cli',
    outputBytes: 16384,
    lockWaitMs: 120000,
    lookupTimeoutMs: 120000,
    onOutput: (text, stream) => { process[stream].write(text) },
  })
  if (result.exitCode === 127) process.stderr.write('oh: pnpm was not found; install pnpm and make it available on PATH.\n')
  for (const { name, version, runtimeVersion } of result.incompatible ?? []) {
    process.stderr.write(`oh: to accept the risk, run: oh plugin --profile ${profile} allow-version ${name}@${version} --oh-version ${runtimeVersion} --accept-risk\n`)
  }
  if (result.exitCode !== 0) process.stderr.write(`oh: plugin command failed; diagnostics: ${result.logPath}\n`)
  if (result.exitCode !== 0 && args.some(argument => /^git\+|^github:|\.git(?:#|$)/.test(argument))) {
    process.stderr.write(`oh: git-hosted plugins build on install via their prepare script, which pnpm blocks until allowed — add the exact key pnpm printed above under allowBuilds in ${join(resolveProfileDir(profile), 'pnpm-workspace.yaml')}, then re-run\n`)
  }
  return result.exitCode
}
