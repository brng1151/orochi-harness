/** Filesystem ownership for the Electron-managed desktop installation. */

import { join } from 'node:path'
import { resolveOhHome } from '@orochi-network/oh-home-paths'

/** Stable desktop installation paths under the shared Harness home. */
export interface DesktopPaths {
  readonly profile: string
  readonly lock: string
}

/**
 * Resolve every Electron-owned path without changing the shared data roots.
 * @param ohHome - Harness home shared with npm-installed oh.
 * @returns immutable desktop path set.
 */
export function resolveDesktopPaths(ohHome: string = resolveOhHome()): DesktopPaths {
  return {
    profile: join(ohHome, 'profiles', 'desktop'),
    lock: join(ohHome, 'profiles', 'desktop', 'lock'),
  }
}
