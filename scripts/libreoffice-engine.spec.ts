import { expect, it } from 'vitest'
import { selectOfficeEngine } from './libreoffice-packages.mjs'

// The kit is published as @deepseek-ai and installed through an @orochi-network alias, so both scopes occur.
it.each(['@deepseek-ai', '@orochi-network'].flatMap(scope => [
  ['darwin', 'arm64', 'darwin-arm64'], ['darwin', 'x64', 'darwin-x64'],
  ['win32', 'arm64', 'win32-arm64'], ['win32', 'x64', 'win32-x64'],
  ['linux', 'x64', 'wasm'], ['linux', 'arm64', 'wasm'],
  ['darwin', 'other', 'wasm'], ['freebsd', 'x64', 'wasm'],
].map(row => [scope, ...row])))('selects the declared %s engine for %s/%s', (scope, platform, arch, expected) => {
  const optionalDependencies = Object.fromEntries(
    ['darwin-arm64', 'darwin-x64', 'win32-arm64', 'win32-x64', 'wasm']
      .map(engine => [`${scope}/libreoffice-kit-${engine}`, '0.0.1']),
  )
  expect(selectOfficeEngine({ optionalDependencies }, { platform, arch })).toBe(expected)
})

it.each(['@deepseek-ai', '@orochi-network'])('selects a declared %s Linux native target without an OS-specific policy change', (scope) => {
  expect(selectOfficeEngine({ optionalDependencies: { [`${scope}/libreoffice-kit-linux-x64`]: '1' } },
    { platform: 'linux', arch: 'x64' })).toBe('linux-x64')
})

it('uses WASM when no native targets are declared', () => {
  expect(selectOfficeEngine({}, { platform: 'darwin', arch: 'x64' })).toBe('wasm')
})
