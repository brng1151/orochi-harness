/** Release family discovery, publish order, tag naming, and the bump judgements. */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { officialClientBuildEnvironment, writeClientBuildRecord } from '../client-build-environment.ts'
import { releaseFamily, type ReleaseMember } from './families.ts'
import { compareVersions, nextVendorVersion, planShared, reachesPayload } from './bump.ts'

/**
 * A release member standing in for a manifest on disk.
 * @param directory - repository-relative package directory.
 * @param name - package name.
 * @param manifest - manifest fields the subject reads.
 * @returns The member.
 */
function member(directory: string, name: string, manifest: Record<string, unknown> = {}): ReleaseMember {
  return { directory, name, version: '0.0.1', manifest }
}

const roots: string[] = []

function write(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

function buildFixture(environment: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'oh-release-build-'))
  roots.push(root)
  write(join(root, 'package.json'), `${JSON.stringify({ version: environment.OH_CLIENT_VERSION ?? '0.0.1' })}\n`)
  write(join(root, 'apps/web/dist/index.html'), '<main></main>')
  write(join(root, 'packages/client/example/lib/client.js'), 'module.exports = {}\n')
  writeClientBuildRecord(root, environment)
  return root
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
  vi.unstubAllEnvs()
})

describe('release families', () => {
  it('publishes all current experimental packages', () => {
    const members = releaseFamily('oh').members(resolve(import.meta.dirname, '../..'))

    expect(members
      .filter(member => member.directory.startsWith('packages/experimental/'))
      .map(member => member.name)).toEqual([
      '@orochi-network/oh-experimental-agent-team-profile',
      '@orochi-network/oh-experimental-agent-team',
      '@orochi-network/oh-experimental-api-speech-to-text',
      '@orochi-network/oh-experimental-auto-review',
      '@orochi-network/oh-experimental-browser-use-chrome-devtools-mcp',
      '@orochi-network/oh-experimental-browser-use-playwright-mcp',
      '@orochi-network/oh-experimental-browser-use-runtime',
      '@orochi-network/oh-experimental-browser-use-stagehand-native',
      '@orochi-network/oh-experimental-client-ui-agent-team',
      '@orochi-network/oh-experimental-client-ui-voice-input',
      '@orochi-network/oh-experimental-computer-use-cua-driver-mcp',
      '@orochi-network/oh-experimental-computer-use-cua-driver-native',
      '@orochi-network/oh-experimental-inspector',
      '@orochi-network/oh-experimental-ptc-runtime-python',
      '@orochi-network/oh-experimental-schedule-bundle',
      '@orochi-network/oh-experimental-speech-to-text-sensevoice',
      '@orochi-network/oh-experimental-speech-to-text',
      '@orochi-network/oh-experimental-tool-agent-team',
      '@orochi-network/oh-experimental-voice-input-bundle',
      '@orochi-network/oh-experimental-webworker-packer',
      '@orochi-network/oh-experimental-webworker-runtime',
    ])
  })

  it('excludes private applications from the publish set', () => {
    const root = mkdtempSync(join(tmpdir(), 'oh-release-private-'))
    roots.push(root)
    write(join(root, 'apps/public/package.json'), '{"name":"@orochi-network/oh-public","version":"0.0.1"}\n')
    write(join(root, 'apps/private/package.json'), '{"name":"@orochi-network/oh-private","version":"0.0.1","private":true}\n')

    expect(releaseFamily('oh').members(root).map(entry => entry.name)).toEqual(['@orochi-network/oh-public'])
  })

  it('publishes unlisted experimental packages while retaining private exclusions', () => {
    const root = mkdtempSync(join(tmpdir(), 'oh-release-experimental-'))
    roots.push(root)
    write(join(root, 'packages/experimental/prototype/package.json'), JSON.stringify({
      name: '@orochi-network/oh-experimental-prototype',
      version: '0.0.1',
      publishConfig: { access: 'public' },
    }))
    write(join(root, 'packages/experimental/inspector/package.json'), JSON.stringify({
      name: '@orochi-network/oh-experimental-inspector',
      version: '0.0.1',
      private: true,
    }))

    expect(releaseFamily('oh').members(root).map(entry => entry.name)).toEqual([
      '@orochi-network/oh-experimental-prototype',
    ])
  })

  it('bumps private oh workspaces without adding release tags', () => {
    const root = mkdtempSync(join(tmpdir(), 'oh-release-version-'))
    roots.push(root)
    write(join(root, 'package.json'), '{"version":"0.0.1"}\n')
    write(join(root, 'apps/desktop/package.json'), '{"version":"0.0.1","private":true}\n')
    write(join(root, 'packages/experimental/prototype/package.json'), '{"version":"0.0.1","private":true}\n')
    write(join(root, 'packages/core/unselected/package.json'), '{"version":"0.0.1"}\n')

    const oh = releaseFamily('oh')
    const published = member('packages/core/published', '@orochi-network/oh-published')
    const { planned } = planShared(oh, root, [published], '0.0.2')

    expect(planned.map(entry => ({ path: entry.manifestPath, tag: entry.tag }))).toEqual([
      { path: 'package.json', tag: undefined },
      { path: 'packages/core/published/package.json', tag: 'oh-v0.0.2' },
      { path: 'apps/desktop/package.json', tag: undefined },
      { path: 'packages/experimental/prototype/package.json', tag: undefined },
    ])
  })

  it.each(['0.0.2-alpha.1', '0.0.2-canary.1', '0.0.2-rc.1'])(
    'accepts the explicit oh prerelease version %s',
    (version) => {
      const root = mkdtempSync(join(tmpdir(), 'oh-release-prerelease-'))
      roots.push(root)
      write(join(root, 'package.json'), '{"version":"0.0.1"}\n')

      const oh = releaseFamily('oh')
      const published = member('packages/core/published', '@orochi-network/oh-published')
      const plan = planShared(oh, root, [published], version)

      expect(plan.version).toBe(version)
      expect(plan.planned[1]?.tag).toBe(`oh-v${version}`)
    },
  )

  it('names one tag for the whole oh family and one per vendored package', () => {
    const oh = releaseFamily('oh')
    const vendor = releaseFamily('vendor')
    const cli = member('apps/cli', '@orochi-network/oh')
    const cordis = { ...member('vendor/cordis', '@orochi-network/cordis'), version: '4.0.1' }

    expect(oh.tagFor(cli)).toBe('oh-v0.0.1')
    expect(vendor.tagFor(cordis)).toBe('vendor-cordis-v4.0.1')
    // The prefix is constructed, not recovered from a tag: a version with a
    // hyphen would defeat any suffix-stripping.
    expect(vendor.tagPrefixFor({ ...cordis, version: '4.0.0-rc.7' })).toBe('vendor-cordis-v')
    expect(vendor.tagFor({ ...cordis, version: '4.0.0-rc.7' })).toBe('vendor-cordis-v4.0.0-rc.7')
  })

  it('assigns alpha and canary dist-tags only to oh releases', () => {
    const oh = releaseFamily('oh')
    const vendor = releaseFamily('vendor')

    expect(oh.distTagForVersion('0.0.2-alpha.1')).toBe('alpha')
    expect(oh.distTagForVersion('0.0.2-canary.1')).toBe('canary')
    expect(oh.distTagForVersion('0.0.2-rc.1')).toBe('next')
    expect(oh.distTagForVersion('0.0.2')).toBeUndefined()
    expect(vendor.distTagForVersion('4.0.1-alpha.1')).toBe('next')
    expect(vendor.distTagForVersion('4.0.1-canary.1')).toBe('next')
  })

  it('rejects a family whose members disagree on the shared version', () => {
    const oh = releaseFamily('oh')
    const members = [member('apps/cli', '@orochi-network/oh'), { ...member('apps/web', '@orochi-network/oh-web-frontend'), version: '0.0.2' }]

    expect(() => { oh.verifyVersions(members) }).toThrow(/must share one version/)
    expect(() => { oh.verifyVersions([members[0]!]) }).not.toThrow()
  })

  it('accepts independent vendored versions and rejects an unpublishable one', () => {
    const vendor = releaseFamily('vendor')
    const members = [
      { ...member('vendor/cordis', '@orochi-network/cordis'), version: '4.0.1' },
      { ...member('vendor/cosmokit', '@orochi-network/cosmokit'), version: '1.8.2' },
    ]

    expect(() => { vendor.verifyVersions(members) }).not.toThrow()
    expect(() => { vendor.verifyVersions([{ ...members[0]!, version: 'latest' }]) }).toThrow(/unpublishable version/)
  })

  it('requires a current official client build only for oh artifacts', () => {
    const oh = releaseFamily('oh')
    const vendor = releaseFamily('vendor')
    const officialEnvironment = officialClientBuildEnvironment(resolve(import.meta.dirname, '../..'))
    vi.stubEnv('OH_CLIENT_COMMIT_HASH', officialEnvironment.OH_CLIENT_COMMIT_HASH)
    const official = buildFixture(officialEnvironment)
    const defaultBuild = buildFixture({})
    const missing = join(defaultBuild, 'missing')
    write(join(missing, 'package.json'), `${JSON.stringify({ version: officialEnvironment.OH_CLIENT_VERSION })}\n`)

    expect(() => { oh.verifyBuildArtifacts(official) }).not.toThrow()
    expect(() => { oh.verifyBuildArtifacts(defaultBuild) }).toThrow(/OH_CLIENT_TITLE/)
    expect(() => { oh.verifyBuildArtifacts(missing) }).toThrow(/record.*missing/)
    expect(() => { vendor.verifyBuildArtifacts(missing) }).not.toThrow()

    write(join(official, 'packages/client/example/lib/client.js'), 'module.exports = { changed: true }\n')
    expect(() => { oh.verifyBuildArtifacts(official) }).toThrow(/artifacts differ/)
  })

  it('publishes a dependency before its consumer, and orders ties by name', () => {
    const oh = releaseFamily('oh')
    const members = [
      member('packages/a/consumer', '@orochi-network/oh-consumer', { dependencies: { '@orochi-network/oh-library': 'workspace:^' } }),
      member('packages/a/library', '@orochi-network/oh-library'),
      member('packages/a/zebra', '@orochi-network/oh-zebra'),
    ]

    expect(oh.publishOrder(members).order.map(entry => entry.name)).toEqual([
      '@orochi-network/oh-library',
      '@orochi-network/oh-consumer',
      '@orochi-network/oh-zebra',
    ])
  })

  it('reports a runtime dependency cycle instead of emitting an arbitrary order', () => {
    const oh = releaseFamily('oh')
    const members = [
      member('packages/a/left', '@orochi-network/oh-left', { dependencies: { '@orochi-network/oh-right': 'workspace:^' } }),
      member('packages/a/right', '@orochi-network/oh-right', { dependencies: { '@orochi-network/oh-left': 'workspace:^' } }),
    ]

    expect(() => { oh.publishOrder(members) }).toThrow(/dependency cycle/)
  })

  it('publishes a peer before its consumer', () => {
    const oh = releaseFamily('oh')
    const members = [
      member('packages/a/consumer', '@orochi-network/oh-consumer', { peerDependencies: { '@orochi-network/oh-zebra': 'workspace:^' } }),
      member('packages/a/zebra', '@orochi-network/oh-zebra'),
    ]

    // Name order alone would place the consumer first; the peer edge moves it.
    expect(oh.publishOrder(members).order.map(entry => entry.name)).toEqual([
      '@orochi-network/oh-zebra',
      '@orochi-network/oh-consumer',
    ])
  })

  it('orders around a peer cycle rather than refusing to publish, and reports the edge it dropped', () => {
    const oh = releaseFamily('oh')
    const members = [
      member('packages/a/left', '@orochi-network/oh-left', { peerDependencies: { '@orochi-network/oh-right': 'workspace:^' } }),
      member('packages/a/right', '@orochi-network/oh-right', { peerDependencies: { '@orochi-network/oh-left': 'workspace:^' } }),
    ]

    // Sibling packages declare each other as peers, and npm treats an unmet peer
    // as a warning, so this pair has to publish rather than fail the release.
    const plan = oh.publishOrder(members)
    expect(plan.order.map(entry => entry.name)).toEqual([
      '@orochi-network/oh-right',
      '@orochi-network/oh-left',
    ])
    // One of the two edges has to give, and which one it is belongs in the log.
    expect(plan.droppedPeerEdges).toEqual([
      { consumer: '@orochi-network/oh-right', peer: '@orochi-network/oh-left' },
    ])
  })

  it('honours an install edge even when a peer cycle surrounds it', () => {
    const oh = releaseFamily('oh')
    const members = [
      member('packages/a/base', '@orochi-network/oh-base', { peerDependencies: { '@orochi-network/oh-consumer': 'workspace:^' } }),
      member('packages/a/consumer', '@orochi-network/oh-consumer', {
        dependencies: { '@orochi-network/oh-base': 'workspace:^' },
        peerDependencies: { '@orochi-network/oh-base': 'workspace:^' },
      }),
    ]

    // The install edge is absolute: base publishes first, and the peer edge that
    // would reverse it is the one dropped.
    const plan = oh.publishOrder(members)
    expect(plan.order.map(entry => entry.name)).toEqual([
      '@orochi-network/oh-base',
      '@orochi-network/oh-consumer',
    ])
    expect(plan.droppedPeerEdges).toEqual([
      { consumer: '@orochi-network/oh-base', peer: '@orochi-network/oh-consumer' },
    ])
  })

  it('refuses an order that would publish a consumer before a dependency it installs', () => {
    const oh = releaseFamily('oh')
    const members = [
      member('packages/a/alpha', '@orochi-network/oh-alpha', { peerDependencies: { '@orochi-network/oh-bravo': 'workspace:^' } }),
      member('packages/a/bravo', '@orochi-network/oh-bravo', { peerDependencies: { '@orochi-network/oh-charlie': 'workspace:^' } }),
      member('packages/a/charlie', '@orochi-network/oh-charlie', { dependencies: { '@orochi-network/oh-alpha': 'workspace:^' } }),
    ]

    // A cycle of two peer edges closed by one install edge: dropping a peer edge
    // would order this, and the traversal drops the install edge instead. That
    // order would publish charlie before the alpha it installs, so it is refused
    // here rather than published.
    expect(() => { oh.publishOrder(members) }).toThrow(/no publish order honours @orochi-network\/oh-charlie -> @orochi-network\/oh-alpha/)
  })

  it('ignores devDependencies when ordering', () => {
    const oh = releaseFamily('oh')
    const members = [
      member('packages/a/alpha', '@orochi-network/oh-alpha', { devDependencies: { '@orochi-network/oh-zebra': 'workspace:^' } }),
      member('packages/a/zebra', '@orochi-network/oh-zebra'),
    ]

    // A dev dependency is absent from the published package, so it must not move
    // the consumer behind it.
    expect(oh.publishOrder(members).order.map(entry => entry.name)).toEqual([
      '@orochi-network/oh-alpha',
      '@orochi-network/oh-zebra',
    ])
  })

  it('applies the harness payload policy to oh and keeps upstream payloads for vendored packages', () => {
    const oh = releaseFamily('oh')
    const vendor = releaseFamily('vendor')
    const harness = member('packages/a/library', '@orochi-network/oh-library')
    const vendored = member('vendor/cordis', '@orochi-network/cordis')

    expect(() => { oh.validatePayload(harness, ['package/lib/index.js', 'package/src/index.ts']) })
      .toThrow(/publishes source file/)
    expect(() => { vendor.validatePayload(vendored, ['package/lib/index.js', 'package/src/index.ts']) }).not.toThrow()
    expect(() => { vendor.validatePayload(vendored, []) }).toThrow(/empty tarball/)
  })

  it('drives the installed entry only for the family that publishes one', () => {
    expect(releaseFamily('oh').installedEntry).toEqual({ packageName: '@orochi-network/oh', binPath: 'lib/bin.js' })
    expect(releaseFamily('vendor').installedEntry).toBeUndefined()
  })

  it('rejects an unknown family identifier', () => {
    expect(() => { releaseFamily('native') }).toThrow(/unknown release family/)
  })
})

describe('vendored version baseline', () => {
  it('drops an upstream prerelease segment and increments the patch', () => {
    expect(nextVendorVersion('4.0.0-rc.7', undefined)).toBe('4.0.1')
    expect(nextVendorVersion('1.0.0-rc.5', undefined)).toBe('1.0.1')
    expect(nextVendorVersion('1.8.1', undefined)).toBe('1.8.2')
  })

  it('increments from the last published version when a re-sync restored a lower one', () => {
    // Upstream moved rc.7 -> rc.8 after this repository published 4.0.1;
    // incrementing the manifest alone would name 4.0.1 a second time.
    expect(nextVendorVersion('4.0.0-rc.8', '4.0.1')).toBe('4.0.2')
    expect(nextVendorVersion('4.1.0', '4.0.1')).toBe('4.1.1')
  })

  it('appends a rehearsal prerelease without consuming its release numbers', () => {
    // A rehearsal burns 4.0.1-rc.1 and leaves 4.0.1 free, so the stable release
    // that follows takes those same numbers instead of skipping to 4.0.2.
    expect(nextVendorVersion('4.0.0-rc.7', undefined, 'rc.1')).toBe('4.0.1-rc.1')
    expect(nextVendorVersion('4.0.0-rc.7', '4.0.1-rc.1', 'rc.2')).toBe('4.0.1-rc.2')
    expect(nextVendorVersion('4.0.0-rc.7', '4.0.1-rc.1')).toBe('4.0.1')
    expect(nextVendorVersion('4.0.0-rc.7', '4.0.1')).toBe('4.0.2')
  })
})

describe('version precedence', () => {
  it('orders alpha, canary, and release-candidate versions by semver precedence', () => {
    expect(compareVersions('4.0.1-alpha.1', '4.0.1-canary.1')).toBeLessThan(0)
    expect(compareVersions('4.0.1-canary.1', '4.0.1-rc.1')).toBeLessThan(0)
    expect(compareVersions('4.0.1-rc.1', '4.0.1')).toBeLessThan(0)
  })

  it('ranks a release above the prerelease it follows', () => {
    // git --sort=v:refname disagrees, placing 4.0.1-rc.1 above 4.0.1, which is
    // why the newest published version is chosen here rather than by git.
    expect(compareVersions('4.0.1', '4.0.1-rc.1')).toBeGreaterThan(0)
    expect(compareVersions('4.0.1-rc.1', '4.0.1')).toBeLessThan(0)
  })

  it('compares numeric prerelease fields numerically', () => {
    expect(compareVersions('4.0.1-rc.10', '4.0.1-rc.1')).toBeGreaterThan(0)
    expect(compareVersions('4.0.1-rc.2', '4.0.1-rc.10')).toBeLessThan(0)
  })

  it('ranks a numeric field below an alphanumeric one, and a shorter list below a longer', () => {
    expect(compareVersions('4.0.1-1', '4.0.1-alpha')).toBeLessThan(0)
    expect(compareVersions('4.0.1-rc', '4.0.1-rc.1')).toBeLessThan(0)
    expect(compareVersions('4.0.2', '4.0.1')).toBeGreaterThan(0)
    expect(compareVersions('4.0.1-rc.1', '4.0.1-rc.1')).toBe(0)
  })
})

describe('payload change judgement', () => {
  const sourceShipping = member('vendor/cosmokit', '@orochi-network/cosmokit', {
    files: ['lib/index.js', 'lib/types/**/*.d.ts', 'src'],
  })
  const buildOutputOnly = member('vendor/cordis', '@orochi-network/cordis', {
    files: ['lib/index.js', 'lib/types/**/*.d.ts', 'bin.js'],
  })

  it('counts the manifest and the files npm always publishes', () => {
    expect(reachesPayload(sourceShipping, 'vendor/cosmokit/package.json')).toBe(true)
    expect(reachesPayload(sourceShipping, 'vendor/cosmokit/README.md')).toBe(true)
    expect(reachesPayload(sourceShipping, 'vendor/cosmokit/src/index.ts')).toBe(true)
  })

  it('counts build inputs for a package whose payload is build output', () => {
    // cordis publishes lib/ only, and lib/ is not tracked: without this, a real
    // source change reads as "nothing changed" and the next publish fails on a
    // version whose bytes moved.
    expect(reachesPayload(buildOutputOnly, 'vendor/cordis/src/context.ts')).toBe(true)
    expect(reachesPayload(buildOutputOnly, 'vendor/cordis/tsconfig.json')).toBe(true)
  })

  it('ignores paths no tarball carries', () => {
    expect(reachesPayload(sourceShipping, 'vendor/cosmokit/tests/unit.spec.ts')).toBe(false)
    expect(reachesPayload(sourceShipping, 'vendor/cosmokit/CHANGELOG.md')).toBe(false)
    // The README pattern is deliberately loose: over-reporting a change costs one
    // unnecessary patch bump, while under-reporting fails the next publish on a
    // version whose bytes moved.
    expect(reachesPayload(sourceShipping, 'vendor/cosmokit/README.i18n.yaml')).toBe(true)
    expect(reachesPayload(member('packages/a/library', '@orochi-network/oh-library', { files: ['lib/index.js'] }),
      'packages/a/library/tests/library.spec.ts')).toBe(false)
  })
})
