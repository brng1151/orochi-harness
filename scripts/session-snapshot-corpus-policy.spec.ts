import { describe, expect, it } from 'vitest'
import { SESSION_FORMAT_VERSION } from '@orochi-network/oh-session'
import { assertSnapshotCorpusPolicy } from './session-snapshot-corpus-policy.ts'

const current = { key: 'session/current', selectedVersions: Array<number>(8).fill(SESSION_FORMAT_VERSION) }
const multiHop = { key: 'session/multi-hop', selectedVersions: [SESSION_FORMAT_VERSION, SESSION_FORMAT_VERSION, SESSION_FORMAT_VERSION] }

describe('recorded-session corpus policy', () => {
  it('counts every selected role of every current-writer owner', () => {
    expect(assertSnapshotCorpusPolicy([current, multiHop]))
      .toEqual({ currentRoles: 11, owningScenarios: 2 })
  })

  it('rejects a scenario that owns no selected role', () => {
    expect(() => assertSnapshotCorpusPolicy([{ key: 'session/empty', selectedVersions: [] }]))
      .toThrow('session/empty: scenario owns no selected Session role')
  })

  it('rejects an empty corpus', () => {
    expect(() => assertSnapshotCorpusPolicy([])).toThrow('Session corpus owns no selected Session role')
  })

  it.each([0, 1, 2, 3, 4, SESSION_FORMAT_VERSION + 1])(
    'rejects a scenario still selecting v%s', (version) => {
      expect(() => assertSnapshotCorpusPolicy([{ key: 'session/old', selectedVersions: [version] }]))
        .toThrow(`session/old: selected Session generation v${version} must be current v${SESSION_FORMAT_VERSION}`)
    },
  )

  it('rejects a scenario mixing a retained generation with the current one', () => {
    expect(() => assertSnapshotCorpusPolicy([{ key: 'sdk/mixed', selectedVersions: [SESSION_FORMAT_VERSION, 4] }]))
      .toThrow(`sdk/mixed: selected Session generation v4 must be current v${SESSION_FORMAT_VERSION}`)
  })
})
