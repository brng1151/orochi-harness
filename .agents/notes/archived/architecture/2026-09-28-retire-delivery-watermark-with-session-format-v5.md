# Agent Note: Retire the delivery acceptance watermark with Session format V5

Status: implemented
Archived: 2026-09-28

English | [中文](2026-09-28-retire-delivery-watermark-with-session-format-v5.zh.md)

## Problem

`session-log-deepseek/delivery-accepted` was a V4 event type. It recorded that the Session log had been accepted by the hosted upload path, together with the Session id it belonged to and the last sequence the upload covered. The upload packages are gone from the current composition, so no writer produces the record, but released V4 artifacts still contain it.

The [reporting-path removal](../simplification/2026-09-28-remove-session-data-reporting-paths.md) assumed the frozen V0–V4 readers were enough: it left the event declared in those packages and expected a build that no longer understands the type to keep reading every committed log. That assumption is wrong. The V4 read path validates a released artifact against the installed `SessionEventMap`, and removing the declaration from the current vocabulary made a V4 log containing the record fail restoration with `SessionFormatUnsupportedMigrationError`. A log an earlier build wrote must not become unreadable because a feature disappeared, and nothing else in the current composition writes or consumes the record.

The record is also not ordinary payload. Its `seq` participates in the artifact's dense numbering, and other events cite earlier positions through `sourceEventSeqs`, replacement endpoints, command completion, title citations, compaction spans, and image-offload targets. Dropping it therefore renumbers envelopes and invalidates every same-artifact reference after it, including the seeded inherited cut.

## Decision

`SESSION_FORMAT_VERSION` advances to 5 and a `session-format-v4-to-v5` edge joins the adjacent chain. V5 is V4's framing, header, envelope, and payload rules unchanged; its only difference is that the event type does not exist. The edge removes every `session-log-deepseek/delivery-accepted` record regardless of its recorded `sessionFormatVersion`, renumbers the following envelopes densely, and rewrites the audited same-artifact references to target coordinates. Every other event, payload, timestamp, and identifier is preserved, and the inherited cut follows the surviving prefix.

The removed record is not translated, preserved as opaque JSON, or re-encoded under another name. The stage performs no delivery-ownership, `throughSeq`, or `sessionId` check: the watermark names an upload this build never performs, and a record that cannot influence the V5 artifact has no coordinate the successor could honour. Re-validating it would only refuse logs for a reason the V5 reader no longer has a use for.

A V5 artifact that still carries the record is refused as an unknown event type, so the retirement is enforced on the way out as well as on the way in. The [released-format policy](2026-08-31-released-session-format-migrations.md) owns the immutability rule this follows: V0–V4 packages, their READMEs, and their recorded schemas are untouched, and V5 is a version-named successor rather than an edit to a committed generation.

## Alternatives considered

**Leave the event declared in the current `SessionEventMap` and keep refusing nothing.** This keeps the type readable but leaves a dead writer-facing protocol in the vocabulary of every future format, and the upload path it describes is gone. The [event-name registration decision](2026-08-30-retain-ignorable-external-session-events.md) already rejected registration for a different reason; keeping a dead type registered is the same mistake without the benefit.

**Mark the record `ignorable: true` during conversion instead of removing it.** That preserves the rows and avoids renumbering, but it carries a dead record type into every converted log forever and still makes readers interpret a watermark that no longer means anything. Retirement should be visible as absence, not as a permanently tolerated ghost.

**Keep the record and give V5 a delivery-ownership rule of its own.** This preserves the V4 refusal behaviour at the cost of re-implementing frozen generation semantics in a new package, so that a V4 log is refused for a watermark the V5 format no longer models.

**Re-open V4 through a corrected vocabulary instead of adding a version.** Editing the frozen V4 package would change what shipped, and the accepted V4 checkpoint already recorded the digests that a later reader depends on.

## Consequences

Every released V0–V4 log opens again, and a V4 log containing the watermark converts to a V5 artifact without it. A converted Session no longer records which uploads an earlier build accepted for it; nothing in the current composition produces that information, so no new provenance is lost. The JSONL backend publishes the V5 successor beside unchanged predecessor files, exactly as it does for every other adjacent edge.

Comparison of recorded sessions no longer needs a delivery-generation token. `normalizeSessionSnapshots` restores every versioned input before comparing, and a restored input can no longer carry the retired record, so the `nativeWriterOutput` option and the `{{sourceSessionFormatVersion}}` substitution had no remaining subject and were removed. `normalizeSessionFormatMetadata` keeps its recorded form for wire notifications, which are compared without a migration pass.

V4 delivery-ownership relationships have no V5 counterpart. The V4 delivery guards in the [V3-to-V4 specification](../../../../packages/session/session-format-v3-to-v4/README.md) remain the frozen record of what the V4 reader checked, and the [V4-to-V5 specification](../../../../packages/session/session-format-v4-to-v5/README.md) states that this edge drops the record rather than re-checking it.

## Verification

The new package's own suites pass 25 tests with 100% statement, branch, function, and line coverage of its source: the drop at every position, dense renumbering, opaque-extension preservation, each audited reference member, the moved seeded cut, the agreement and disagreement cases, and every refusal. The composed catalog, JSONL publication, and committed corpus suites pass together with the frozen V0–V4 edge tests, which now assert that the installed chain drops the record while the V3-to-V4 edge still keeps and checks it in its own coordinates.

`pnpm run verify-persistence-changes` accepts the transition recorded in `docs/persistence-changes/2026-09-28-session-format-v5.md`: `SessionHeader.version` and the removed event root, each with a version bump. `pnpm run verify-persistence-formats` verifies the archived V4 reference created from this checkout's V4 declaration before the writer advanced.
