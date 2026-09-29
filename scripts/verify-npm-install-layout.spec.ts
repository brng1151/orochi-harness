import { describe, expect, it } from 'vitest'
import type { NpmPackageLock, RegistryIndex } from './benchmark-npm-resolution.ts'
import {
  assertDualOhInstallLayout,
  buildDualOhRegistry,
} from './verify-npm-install-layout.ts'

function validLayout(): NpmPackageLock {
  return {
    lockfileVersion: 3,
    packages: {
      '': { dependencies: { '@orochi-network/oh': '0.2.0', 'oh-previous': 'npm:@orochi-network/oh@0.1.0' } },
      'node_modules/@orochi-network/cordis': { version: '4.0.1' },
      'node_modules/@orochi-network/oh': {
        version: '0.2.0',
        dependencies: { '@orochi-network/oh-child': '^0.2.0' },
        peerDependencies: { '@orochi-network/cordis': '^4.0.1' },
      },
      'node_modules/@orochi-network/oh-child': {
        version: '0.2.0',
        dependencies: { '@orochi-network/oh-leaf': '^0.2.0' },
      },
      'node_modules/@orochi-network/oh-leaf': { version: '0.2.0' },
      'node_modules/oh-previous': {
        name: '@orochi-network/oh',
        version: '0.1.0',
        dependencies: { '@orochi-network/oh-child': '^0.1.0' },
        peerDependencies: { '@orochi-network/cordis': '^4.0.1' },
      },
      'node_modules/oh-previous/node_modules/@orochi-network/oh-child': {
        version: '0.1.0',
        dependencies: { '@orochi-network/oh-leaf': '^0.1.0' },
      },
      'node_modules/oh-previous/node_modules/@orochi-network/oh-leaf': { version: '0.1.0' },
    },
  }
}

describe('npm install layout verifier', () => {
  it('creates two incompatible versions of every OH package', () => {
    const index: RegistryIndex = new Map([
      ['@orochi-network/oh', new Map([['0.1.1-rc.2', {
        name: '@orochi-network/oh',
        version: '0.1.1-rc.2',
        dependencies: { '@orochi-network/oh-child': '^0.1.1-rc.2' },
        peerDependencies: { '@orochi-network/cordis': '^4.0.1' },
      }]])],
      ['@orochi-network/oh-child', new Map([['0.1.1-rc.2', {
        name: '@orochi-network/oh-child',
        version: '0.1.1-rc.2',
      }]])],
      ['@orochi-network/cordis', new Map([['4.0.1', {
        name: '@orochi-network/cordis',
        version: '4.0.1',
      }]])],
    ])

    const dual = buildDualOhRegistry(index, '0.1.1-rc.2')

    expect([...dual.get('@orochi-network/oh')?.keys() ?? []]).toEqual(['0.1.0', '0.2.0'])
    expect(dual.get('@orochi-network/oh')?.get('0.1.0')).toMatchObject({
      version: '0.1.0',
      dependencies: { '@orochi-network/oh-child': '^0.1.0' },
      peerDependencies: { '@orochi-network/cordis': '^4.0.1' },
    })
    expect(dual.get('@orochi-network/oh')?.get('0.2.0')).toMatchObject({
      version: '0.2.0',
      dependencies: { '@orochi-network/oh-child': '^0.2.0' },
    })
    expect(dual.get('@orochi-network/cordis')).toBe(index.get('@orochi-network/cordis'))
  })

  it('accepts isolated OH releases with one shared Cordis installation', () => {
    expect(assertDualOhInstallLayout(validLayout())).toEqual({
      ohPackagesPerVersion: 3,
      checkedOhEdges: 4,
    })
  })

  it.each([
    ['react', 'node_modules/react'],
    ['react-dom', 'node_modules/react-dom'],
    ['react', 'node_modules/oh-previous/node_modules/react'],
    ['react-dom', 'node_modules/oh-previous/node_modules/react-dom'],
  ])('rejects browser runtime %s installed at %s in the OH-only consumer', (name, path) => {
    const layout = validLayout()
    const packages = { ...layout.packages, [path]: { version: '18.3.1' } }
    expect(() => assertDualOhInstallLayout({ ...layout, packages })).toThrow(
      `${path}: ${name} is a browser build input`,
    )
  })

  it('rejects an internal edge that crosses release versions', () => {
    const layout = validLayout()
    const packages = { ...layout.packages }
    Reflect.deleteProperty(packages, 'node_modules/oh-previous/node_modules/@orochi-network/oh-leaf')

    expect(() => assertDualOhInstallLayout({ ...layout, packages })).toThrow(
      'node_modules/oh-previous/node_modules/@orochi-network/oh-child: dependencies '
      + '@orochi-network/oh-leaf resolves to node_modules/@orochi-network/oh-leaf@0.2.0, expected 0.1.0',
    )
  })

  it('rejects a second Cordis installation', () => {
    const layout = validLayout()
    const packages = {
      ...layout.packages,
      'node_modules/oh-previous/node_modules/@orochi-network/cordis': { version: '4.0.1' },
    }

    expect(() => assertDualOhInstallLayout({ ...layout, packages })).toThrow(
      'expected one shared @orochi-network/cordis',
    )
  })
})
