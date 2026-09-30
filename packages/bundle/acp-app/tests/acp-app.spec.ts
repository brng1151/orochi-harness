/** The ACP app bundle's declared profile patch. */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as yaml from 'js-yaml'
import { describe, expect, it } from 'vitest'
import { entryListSchema } from '@orochi-network/cordis-plugin-include'

describe('oh-acp-app bundle', () => {
  it('declares startup-gated ACP serving without overriding base HMR policy', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      oh?: { bundle?: { patch?: string } }
    }
    expect(manifest.oh?.bundle?.patch).toBe('./cordis.patch.yml')
    expect(manifest.dependencies).toHaveProperty('@orochi-network/oh-acp')
    const patches = yaml.load(
      readFileSync(resolve(root, manifest.oh!.bundle!.patch!), 'utf8'),
      { schema: entryListSchema },
    ) as Array<{
      id?: string
      disabled?: boolean
      insert?: Array<{ config?: { model?: string; provider?: string }; id?: string; inject?: string[]; name?: string }>
    }>
    expect(patches.find(patch => patch.id === 'hmr')).toMatchObject({ disabled: true })
    expect(patches.find(patch => patch.id === 'session-title-llm')).toMatchObject({ disabled: true })
    const rows = patches.flatMap(patch => patch.insert ?? [])
    expect(rows.find(row => row.id === 'acp-app-startup')?.name).toBe('@orochi-network/oh-acp-app')
    expect(rows.find(row => row.id === 'acp')).toMatchObject({
      inject: ['acpAppStartup'],
      config: { provider: 'orochi-official', model: 'xiaomi/mimo-v2.6-flash' },
    })
  })
})
