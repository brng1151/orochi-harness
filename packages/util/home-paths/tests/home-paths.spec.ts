import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_OH_HOME_DISPLAY,
  OH_HOME_DIR_NAME,
  canonicalizeWatchPath,
  defaultOhHome,
  ohCachePath,
  ohHomeDisplay,
  ohHomePath,
  expandHomePath,
  resolveOhHome,
} from '@orochi-network/oh-home-paths'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('oh path helpers', () => {
  it('owns the shared default OH home directory name', () => {
    expect(OH_HOME_DIR_NAME).toBe('.oh')
    expect(DEFAULT_OH_HOME_DISPLAY).toBe('~/.oh')
    expect(defaultOhHome()).toBe(join(homedir(), '.oh'))
  })

  it('expands tilde paths without changing non-tilde paths', () => {
    expect(expandHomePath('~')).toBe(homedir())
    expect(expandHomePath('~/.oh')).toBe(join(homedir(), '.oh'))
    expect(expandHomePath('~\\.oh')).toBe(join(homedir(), '.oh'))
    expect(expandHomePath('/tmp/.oh')).toBe('/tmp/.oh')
    expect(expandHomePath('~other/.oh')).toBe('~other/.oh')
  })

  it('resolves explicit path before OH_HOME and the default', () => {
    const envHome = join(homedir(), 'env-oh')

    expect(resolveOhHome('/tmp/explicit-oh', { OH_HOME: '~/env-oh' })).toBe(resolve('/tmp/explicit-oh'))
    expect(resolveOhHome(undefined, { OH_HOME: '~/env-oh' })).toBe(envHome)
    expect(resolveOhHome(undefined, {})).toBe(defaultOhHome())
  })

  it('treats an empty or whitespace-only OH_HOME as unset', () => {
    expect(resolveOhHome(undefined, { OH_HOME: '' })).toBe(defaultOhHome())
    expect(resolveOhHome(undefined, { OH_HOME: '   ' })).toBe(defaultOhHome())
  })

  it('joins child segments onto the resolved OH_HOME', () => {
    vi.stubEnv('OH_HOME', '~/env-oh')
    expect(ohHomePath()).toBe(join(homedir(), 'env-oh'))
    expect(ohHomePath('storages', 'cache')).toBe(join(homedir(), 'env-oh', 'storages', 'cache'))
  })

  it('labels a resolved home by whether it is the default root', () => {
    expect(ohHomeDisplay(resolve(defaultOhHome()))).toBe('~/.oh')
    expect(ohHomeDisplay('/some/other/root')).toBe('$OH_HOME')
  })

  it.each([
    [undefined, join(homedir(), '.oh')],
    ['', join(homedir(), '.oh')],
    ['   ', join(homedir(), '.oh')],
    ['~/env-oh', join(homedir(), 'env-oh')],
    ['./relative-oh', resolve('./relative-oh')],
  ] as const)('resolves cache paths with OH_HOME=%j', (home, expectedHome) => {
    vi.stubEnv('OH_HOME', home)
    try {
      expect(ohCachePath()).toBe(join(expectedHome, 'cache'))
      expect(ohCachePath('models', 'index.json')).toBe(join(expectedHome, 'cache', 'models', 'index.json'))
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('resolves configured cache homes before the environment', () => {
    vi.stubEnv('OH_HOME', '~/env-oh')
    try {
      expect(ohCachePath({ ohHome: '~/explicit-oh' })).toBe(join(homedir(), 'explicit-oh', 'cache'))
      expect(ohCachePath({ ohHome: './explicit-oh' }, 'attachments', 'request-images'))
        .toBe(resolve('./explicit-oh/cache/attachments/request-images'))
      expect(ohCachePath({}, 'attachments')).toBe(join(homedir(), 'env-oh', 'cache', 'attachments'))
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('canonicalizes a watcher ancestor while preserving a missing suffix', async () => {
    const root = await mkdtemp(join(tmpdir(), 'oh-watch-path-'))
    const target = join(root, 'target')
    const alias = join(root, 'alias')
    try {
      await mkdir(target)
      await symlink(target, alias, process.platform === 'win32' ? 'junction' : 'dir')
      await expect(canonicalizeWatchPath(alias)).resolves.toBe(await realpath(target))
      await expect(canonicalizeWatchPath(join(alias, 'later', 'config.yml'))).resolves.toBe(
        join(await realpath(target), 'later', 'config.yml'),
      )
      const file = join(root, 'file')
      await writeFile(file, 'not a directory')
      await expect(canonicalizeWatchPath(join(file, 'child'))).rejects.toMatchObject({ code: 'ENOTDIR' })
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
