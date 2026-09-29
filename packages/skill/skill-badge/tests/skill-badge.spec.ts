import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { Context } from '@orochi-network/cordis'
import { describe, expect, it } from 'vitest'
import SkillRegistry from '@orochi-network/oh-skill'
import * as SkillBadge from '@orochi-network/oh-skill-badge'

describe('oh-skill-badge', () => {
  it('registers and disposes the bundled badge skill', async () => {
    const ctx = new Context()
    await ctx.plugin(SkillRegistry)
    const fiber = await ctx.plugin(SkillBadge)
    const resourcePath = fileURLToPath(new URL('../assets/', import.meta.url))

    expect(await ctx.skills.list()).toEqual([{
      name: 'oh-badge',
      description: 'Add the official “powered by oh” badge to documents, pull requests, merge requests, and other content produced with Orochi Harness. Use whenever creating a pull request or merge request. Also use when the user asks for a oh badge, powered-by-oh attribution, or a reusable oh badge asset or snippet.',
      invocation: { modelInvocable: true, userInvocable: true },
      provider: 'oh-badge',
      source: 'bundled',
      resourceBase: { kind: 'directory', path: resourcePath },
    }])
    const loaded = await ctx.skills.get('oh-badge')
    expect(loaded?.content).toContain('Preserve the badge\'s 121×20 dimensions')
    expect(loaded?.resourceBase).toEqual({ kind: 'directory', path: resourcePath })

    await fiber.dispose()
    expect(await ctx.skills.list()).toEqual([])
  })

  it('ships the official 726×120 PNG unchanged', async () => {
    const image = await readFile(new URL('../assets/oh-badge.png', import.meta.url))
    expect(image.readUInt32BE(16)).toBe(726)
    expect(image.readUInt32BE(20)).toBe(120)
    expect(createHash('sha256').update(image).digest('hex')).toBe(
      'f80993383925aa6c24c0af2feb1f1576d630ba09b5485aa0b0863d6d7ef1dfc4',
    )
  })
})
