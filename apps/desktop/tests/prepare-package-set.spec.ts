import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  assertDesktopHostPackageFiles,
  selectDesktopPackageClosure,
  type PackedDesktopPackage,
} from '../scripts/prepare-package-set.ts'

function packed(name: string, manifest: Record<string, unknown> = {}): PackedDesktopPackage {
  return { tarball: `${name}.tgz`, manifest: { name, version: '1.0.0', ...manifest } }
}

describe('desktop package-set selection', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('does not select a packaging target when imported as a library', async () => {
    vi.stubEnv('OH_DESKTOP_TARGET_PLATFORM', 'linux')
    vi.stubEnv('OH_DESKTOP_TARGET_ARCH', 'x64')
    vi.resetModules()
    await expect(import('../scripts/prepare-package-set.ts')).resolves.toHaveProperty('prepareDesktopPackageSet')
  })

  it('includes only the available internal production closure', () => {
    const available = new Map<string, PackedDesktopPackage>([
      ['@orochi-network/oh', packed('@orochi-network/oh', {
        dependencies: { '@orochi-network/oh-base': '^1.0.0', external: '^2.0.0' },
        optionalDependencies: { '@orochi-network/platform-package': '1.0.0', '@orochi-network/missing-platform': '1.0.0' },
      })],
      ['@orochi-network/oh-desktop-host', packed('@orochi-network/oh-desktop-host', {
        dependencies: { '@orochi-network/oh': '^1.0.0' },
      })],
      ['@orochi-network/oh-base', packed('@orochi-network/oh-base', {
        peerDependencies: { '@orochi-network/cordis': '^1.0.0' },
      })],
      ['@orochi-network/cordis', packed('@orochi-network/cordis')],
      ['@orochi-network/platform-package', packed('@orochi-network/platform-package')],
      ['@orochi-network/unused', packed('@orochi-network/unused')],
    ])
    expect(selectDesktopPackageClosure(available).map(entry => entry.manifest.name)).toEqual([
      '@orochi-network/cordis',
      '@orochi-network/oh',
      '@orochi-network/oh-base',
      '@orochi-network/oh-desktop-host',
      '@orochi-network/platform-package',
    ])
  })

  it.each([
    '@orochi-network/oh-base', '@orochi-network/cordis', '@orochi-network/node-addon-system',
  ])('rejects required prepared package %s absent from the packed release inputs', (dependency) => {
    const available = new Map<string, PackedDesktopPackage>([
      ['@orochi-network/oh', packed('@orochi-network/oh', {
        dependencies: { [dependency]: '^1.0.0' },
      })],
      ['@orochi-network/oh-desktop-host', packed('@orochi-network/oh-desktop-host', {
        dependencies: { '@orochi-network/oh': '^1.0.0' },
      })],
    ])
    expect(() => selectDesktopPackageClosure(available)).toThrow(/unpacked package/u)
    expect(() => selectDesktopPackageClosure(new Map([
      ['@orochi-network/oh', packed('@orochi-network/oh')],
    ]))).toThrow(/omit @orochi-network\/oh-desktop-host/u)
  })

  it('leaves independently published Office packages to npm resolution', () => {
    const available = new Map<string, PackedDesktopPackage>([
      ['@orochi-network/oh', packed('@orochi-network/oh', {
        dependencies: {
          '@orochi-network/libreoffice-kit': '0.0.1',
          '@orochi-network/libreoffice-kit-wasm': '0.0.1',
        },
      })],
      ['@orochi-network/oh-desktop-host', packed('@orochi-network/oh-desktop-host')],
    ])
    expect(selectDesktopPackageClosure(available).map(entry => entry.manifest.name)).toEqual([
      '@orochi-network/oh', '@orochi-network/oh-desktop-host',
    ])
  })

  it('requires the Desktop Host entry', () => {
    const files = [
      'package/lib/index.js',
    ]
    expect(() => {
      assertDesktopHostPackageFiles(files)
    }).not.toThrow()
    expect(() => {
      assertDesktopHostPackageFiles(files.slice(1))
    }).toThrow(/lib\/index\.js/u)
  })
})
