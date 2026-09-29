# Session format version and release status

English | [中文](session-format-status.zh.md)

## Summary

Use this reference to distinguish the checkout writer, the accepted compatibility baseline, and the latest published Session format. The code constant owns the writer; the finalization and release records below separately identify accepted history and publication evidence. Other documentation links here instead of restating those values.

## Table of Contents

- [Sources of truth](#sources-of-truth)
- [Finalization record](#finalization-record)
- [Release record](#release-record)
- [Updating the record](#updating-the-record)
- [Dev Note](#dev-note)

<a id="sources-of-truth"></a>
## Sources of truth

- **Checkout writer:** `SESSION_FORMAT_VERSION` in [core Session types](../packages/core/session/src/types.ts) is the only hand-maintained current-writer number in code. The [catalog generator](../scripts/gen-session-format-catalog.ts) renders the single installed codec from it. A package version, codec export name, fixture filename, or projection-cache version is not the writer authority.
- **Latest released format:** `latestReleasedVersion` in the following record identifies the published Session format. This fork has published no product release, so that version is `0`; `evidenceTag` names the pre-fork release whose lineage fixed the current writer, not a publication of this fork. The bilingual copy is checked against the same record, not maintained as a separate decision.
- **Release status:** compare the writer constant with the verified release record. A published format means equality with the writer constant; a greater writer version has not shipped. A greater release version is never declared here. When comparing an older checkout against a newer branch’s verified record, a lower writer version identifies an older writer format; the local consistency gate rejects that ordering within one checkout. No separate released boolean is maintained.

This fork is a fresh line with no published release and no legacy Session data, so it declares no accepted compatibility baseline, no release evidence, and no migration chain: a stored header naming any other version is refused. The [versioning and authority decision](../.agents/notes/implemented/architecture/2026-08-10-session-log-version-mechanism.md) owns compatibility decisions and the [single-generation decision](../.agents/notes/implemented/architecture/2026-09-28-single-generation-session-format.md) owns the chainless reader.

The [generated catalog](persistence-catalog.md) documents the one format this build reads and writes.

<a id="finalization-record"></a>
## Finalization record

```yaml session-format-finalization
latestFinalizedVersion: 5
```

V5 has an accepted compatibility baseline in the [checkpoint](persistence-changes/finalized/v5.json). Backward-compatible schema changes may remain V5 through new acknowledgement records. Breaking changes require a higher writer version and their own header transition. Accepted machine records and after schemas remain immutable. [Checkpoint rules](persistence-changes/README.md#compatibility-rules) define the comparison.

Finalization does not freeze every future V5 addition and does not assert publication. The release record below retains the independently verified published version, which this fork has not advanced. Ordinary comments, aliases, source locations, and implementation fixes preserving the accepted meaning do not change this baseline.

<a id="release-record"></a>
## Release record

```yaml session-format-release
latestReleasedVersion: 0
evidenceTag: oh-v0.1.5-alpha.1
```

Evidence: this fork has published no product release. Reference tag `oh-v0.1.5-alpha.1` names the pre-fork lineage whose writer lived at `packages/core/session/src/types.ts`; it is historical context, not a publication of this fork.

<a id="updating-the-record"></a>
## Updating the record

When a structural writer change is implemented, update the code constant and the generated catalog together; do not advance this release record before publication. When a product release first publishes a higher Session format, confirm publication and its tagged writer, then advance this record and the evidence tag in the same bilingual update. Later product releases carrying the same format do not require changing the record. Never lower it on the development trunk.

The [documentation-standard test](../scripts/doc-standard.spec.ts) checks record structure, bilingual equality, evidence-tag and writer-path consistency, and that the documented release does not exceed the checkout writer. This keyless check does not query GitHub or prove that the record is up to date; publication verification remains part of the release update.

Use “current format” and “next version” for general behavior. Keep explicit numbers for wire schemas, historical evidence, and tests of those particular versions. The [format-version cookbook](cookbook/adding-a-session-format-version.md) uses N for the current writer and N+1 for its successor.

<a id="dev-note"></a>
## Dev Note

None.
