/** The experimental Schedule bundle inserts the three Schedule rows the shipped Web composition leaves out. */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as yaml from 'js-yaml'
import { entryListSchema } from '@orochi-network/cordis-plugin-include'

const root = fileURLToPath(new URL('..', import.meta.url))

interface Manifest {
  name?: string
  icon?: string
  private?: boolean
  publishConfig?: { access?: string }
  exports?: Record<string, unknown>
  dependencies?: Record<string, string>
  oh?: { bundle?: { patch?: string } }
}

describe('experimental Schedule bundle', () => {
  const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as Manifest

  it('publishes as an experimental bundle with plugin-manager display metadata', () => {
    expect(manifest.name).toBe('@orochi-network/oh-experimental-schedule-bundle')
    expect(manifest.private).toBeUndefined()
    expect(manifest.publishConfig?.access).toBe('public')
    expect(manifest.icon).toBe('./icon.svg')
    expect(manifest.oh?.bundle?.patch).toBe('./cordis.patch.yml')
    expect(manifest.exports?.['./locale/*.json']).toBe('./locale/*.json')
    expect(manifest.exports?.['./cordis.patch.yml']).toBe('./cordis.patch.yml')
    // Each inserted row names a package the bundle depends on, so the rows resolve from the bundle.
    expect(Object.keys(manifest.dependencies ?? {}).sort()).toEqual([
      '@orochi-network/oh-client-ui-schedule', '@orochi-network/oh-schedule', '@orochi-network/oh-time-context',
    ])
  })

  it('inserts the three Schedule rows switched on', () => {
    const parsed = yaml.load(readFileSync(resolve(root, './cordis.patch.yml'), 'utf8'), { schema: entryListSchema })
    expect(parsed).toEqual([{ insert: [
      { id: 'time-context', name: '@orochi-network/oh-time-context' },
      { id: 'schedule', name: '@orochi-network/oh-schedule' },
      { id: 'ui-schedule', name: '@orochi-network/oh-client-ui-schedule' },
    ] }])
  })
})
