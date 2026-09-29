import { describe, expect, it } from 'vitest'
import { Context } from '@orochi-network/cordis'
import InvariantRegistry from '@orochi-network/oh-invariants'
import { credentialRef } from '../src/index.ts'
import * as CredentialsInvariant from '../src/invariant.ts'
import { MemoryCredentials } from './memory.ts'

const REF = credentialRef('OROCHI_API_KEY')

describe('credentials invariant companion', () => {
  it('accepts a committed change emitted by a live service', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry)
    await ctx.plugin(CredentialsInvariant)
    await ctx.plugin(MemoryCredentials)

    await expect(ctx.credentials.set(REF, 'sk-live')).resolves.toBeUndefined()
  })

  it('fails an update event emitted without a live service', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry)
    await ctx.plugin(CredentialsInvariant)

    expect(() => { ctx.emit('credentials/reference-updated', REF) }).toThrow(/invariant violated by "@orochi-network\/oh-credentials"/)
  })

  it('reserves the package name against duplicate registration', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry)
    await ctx.plugin(CredentialsInvariant)

    expect(() => {
      ctx.invariants.register('@orochi-network/oh-credentials', () => {})
    }).toThrow(/already registered/)
  })
})
