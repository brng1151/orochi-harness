/** Every recorded-session scenario owns one current-writer generation and no retained history. */

import { SESSION_FORMAT_VERSION } from '@orochi-network/oh-session'

/** One owning scenario's selected parent and child generations. */
export interface SnapshotCorpusScenarioGenerations {
  /** Corpus-relative profile/scenario key. */
  readonly key: string
  /** Highest selected generation for every contiguous role. */
  readonly selectedVersions: readonly number[]
}

/** Counts returned after the corpus policy accepts the inventory. */
export interface SnapshotCorpusGenerationSummary {
  /** Selected parent and child roles across every owning scenario. */
  readonly currentRoles: number
  /** Owning scenarios that contributed a selected generation. */
  readonly owningScenarios: number
}

/**
 * Require every owning scenario to select the current writer for all of its roles.
 *
 * This build ships one Session format generation. A directory may hold one
 * generation per parent/ordinal role, and selection always resolves to it, so a
 * scenario retaining an older generation or mixing generations is a corpus error.
 *
 * @param scenarios - Every owning top-level recorded-session scenario.
 * @returns Accepted current role and owning scenario counts.
 */
export function assertSnapshotCorpusPolicy(
  scenarios: readonly SnapshotCorpusScenarioGenerations[],
): SnapshotCorpusGenerationSummary {
  let currentRoles = 0
  for (const scenario of scenarios) {
    if (scenario.selectedVersions.length === 0) {
      throw new Error(`${scenario.key}: scenario owns no selected Session role`)
    }
    const stale = scenario.selectedVersions.find(version => version !== SESSION_FORMAT_VERSION)
    if (stale !== undefined) {
      throw new Error(
        `${scenario.key}: selected Session generation v${stale} must be current v${SESSION_FORMAT_VERSION}`,
      )
    }
    currentRoles += scenario.selectedVersions.length
  }
  if (currentRoles === 0) {
    throw new Error('Session corpus owns no selected Session role')
  }
  return { currentRoles, owningScenarios: scenarios.length }
}
