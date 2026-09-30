import { afterEach, expect, it, vi } from 'vitest'
import { desktopClientVersion } from '../src/client-version.ts'

afterEach(() => { vi.unstubAllEnvs() })

it('reports the inlined client build version', () => {
  vi.stubEnv('OH_CLIENT_VERSION', '1.2.3')
  expect(desktopClientVersion()).toBe('1.2.3')
})

it('refuses a build that carries no client version instead of guessing one', () => {
  vi.stubEnv('OH_CLIENT_VERSION', undefined)
  expect(() => desktopClientVersion()).toThrow(/OH_CLIENT_VERSION/)
  vi.stubEnv('OH_CLIENT_VERSION', '')
  expect(() => desktopClientVersion()).toThrow(/OH_CLIENT_VERSION/)
})
