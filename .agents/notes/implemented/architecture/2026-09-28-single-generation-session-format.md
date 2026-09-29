# Agent Note: This fork ships one Session format generation

Status: implemented

English | [中文](2026-09-28-single-generation-session-format.zh.md)

## Problem

The Session format reached V5 through five adjacent migration packages, each freezing a released physical codec and a streaming conversion between two versions. Reading a V2 session meant running the V0→V1→V2→V3→V4→V5 chain; every reader, the recorded-session corpus, the persistence backend, and the snapshot harness carried that history.

This repository is a fresh fork published as `orochi-network/orochi-harness`. It has no published release, no user data written by an earlier build, and therefore no compatibility obligation to any pre-fork Session artifact. The chain cost a large, permanently maintained subsystem whose only product is the ability to read files the fork will never encounter.

## Decision

The fork ships exactly one Session format generation, V5, and carries no migration chain.

- `SESSION_FORMAT_VERSION` stays 5. A stored header naming any other version is refused before a body is read, on both the read-header and restore paths, with `SessionFormatUnsupportedError` for durable storage.
- The installed V5 physical codec and every native admission rule live in `session-format-catalog`, which the generator renders from the writer constant. `session-format` keeps the shared contract: the catalog factory, the JSON helpers, the error classes, and the canonical filename helpers.
- The recorded-session corpus holds one generation per parent/ordinal role. Every owning scenario's selected fixture is the current writer, and the corpus policy requires exactly that.

## Alternatives considered

Keeping the full chain was the alternative, and it was rejected for the reasons above. A second alternative — keeping the five packages but dropping the corpus policy's coverage requirement — was rejected earlier: it retains the same maintenance cost while removing the check that the chain still works. A third, re-reading only the specific pre-fork version a user's first session names, is the reintroduction path described below and is deferred until a release needs it.

## Consequences

A stored artifact written by a pre-fork build cannot be opened. The refusal names the stored version, leaves the file untouched, and is not retryable without a build that carries the missing edge.

The recorded-session corpus shrank from 491 fixtures to 214: every owning scenario now holds exactly one current-writer generation per role, and the corpus policy checks only that. Because the current writer never emits top-level packed chunk rows, the packed-row physical layout is no longer a readable form, and its dedicated coverage is gone with the edge that produced it.

## What this gives up

A session written by a pre-fork build is unreadable. The owner sees an unsupported-format refusal naming the stored version, not a silent loss: nothing is rewritten, truncated, or migrated in place, and the source file and its bytes are untouched.

Keeping the chain would have preserved that readability. It was not worth the permanent cost of five packages, a per-edge admission and disposition inventory, a migration publication path in the persistence backend, a historical child-catalog prerequisite, a one-time contributor migration command, and a corpus policy whose subject was the history itself.

A future release that must read pre-fork sessions re-adds the adjacent edge for the specific source version it needs. It does not restore the whole chain speculatively, and it does not rename or rewrite any committed generation: it adds a version-named successor beside the unchanged source, which is what the [released-format migration record](../../archived/architecture/2026-08-31-released-session-format-migrations.md) still describes for that case.

## Verification

`pnpm run test:snapshot` replays every recorded-session scenario from its current-writer fixture. `pnpm run verify-session-format-catalog` confirms the generated catalog names exactly one codec and no migrations. `pnpm run verify-persistence-formats` confirms the only format reference is the installed generation, and `pnpm run verify-persistence-changes` confirms the accepted type-change history still matches the declared schemas.
