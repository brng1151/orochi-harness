# Agent Note: Remove the session-log, session-telemetry, and anonymous-user-id reporting paths

Status: implemented

English | [中文](2026-09-28-remove-session-data-reporting-paths.zh.md)

## Problem

Three shipped mechanisms sent Session data or a stable installation identifier off the machine, and two of them were on by default. A security audit found that the default product configuration therefore forwarded more than the model provider's own chat API needs.

- `packages/session/session-log-deepseek` mounted with no configuration attached the complete unaccepted Session-log suffix — every message, tool-call argument, tool result, and the workspace `cwd` — to the `oh_session_log` field of every Orochi request. The base bundle and the SDK-minimal bundle both mounted it, so `enabled` defaulted to `true` in every process.
- `packages/session/session-telemetry` plus `packages/session/session-telemetry-otel` released the canonical Session prefix to `https://harness-telemetry.deepseeksvc.com/v1/logs` after a user `/feedback` action, for every provider.
- `packages/identity/anonymous-user-id` minted a random UUID persisted at `$OH_HOME/.anonymous-user-id` and sent it as `x-orochi-harness-user-id` on every Orochi request and as the OpenTelemetry resource `user.id`. Deleting the file minted a new identity, so the identifier was pseudonymous but stable and linkable across sessions, restarts, and every recipient of those exports.

## Decision

`@orochi-network/oh-session-log-deepseek`, `@orochi-network/oh-session-telemetry`, `@orochi-network/oh-session-telemetry-otel`, and `@orochi-network/oh-anonymous-user-id` no longer exist, together with the now-empty `identity/` package group. The harness sends no Session content, no telemetry, and no installation or user identifier to any endpoint other than the model provider's own chat API. The `x-orochi-harness-user-id` header is gone; `OH_TELEMETRY_MODE`, `OH_TELEMETRY_OTLP_URL`, `OH_TELEMETRY_DISABLED`, `session-log-deepseek.enabled`, and `session-log-deepseek.maxBytes` no longer configure anything. `/feedback` records into the Session log and reports the Session id; it names no anonymous user and shares nothing.

`@orochi-network/oh-plugin-package-inventory-orochi` and its `oh_plugin_packages` field stay, and so does the [request-extension registry decision](../architecture/2026-08-21-deepseek-llm-api-request-extensions.md) that owns it. That field reports which npm packages produced a request; it carries no Session content, no workspace path, and no user or installation identifier. Static app attribution through `user-agent` also stays: it identifies the product on every request, contains no per-user or per-installation value, and is required by [the attribution decision](../architecture/2026-06-21-mandatory-app-attribution-headers.md). `x-orochi-harness-session-id` stays because it names the conversation the provider is already serving, and it leaves only with that conversation.

The `session-log-deepseek/delivery-accepted` event type is not part of the current vocabulary; the [V5 retirement decision](../../archived/architecture/2026-09-28-retire-delivery-watermark-with-session-format-v5.md) removes it from the writer and adds the adjacent edge that lets a V4 log carrying it open again. The released V0–V4 packages still declare the type, because they are frozen readers of what those versions wrote. Nothing in the current composition writes it.

## Alternatives considered

**Default the three paths off instead of removing them.** Rejected. A default that is off by default is still a shipped mechanism with a configuration surface, a documented contract, and an environment switch, and every one of them had already been toggled at least once by composition or launcher code. Removal is the only state in which the guarantee is structural rather than a fact about the current patch file.

**Keep the packages but unmount them from the shipped bundles.** Rejected for the same reason: the code, its tests, its configuration catalog, and its documentation would remain maintained while no composition used them, and a custom profile could remount any of them.

**Keep the anonymous user id for correlation and gate it on the telemetry switch.** Rejected. It is the one mechanism here that identifies the installation across every recipient and every session; leaving it behind an opt-in switch preserves exactly the linkability the removal is meant to end.

**Keep `oh_session_log` and delete only the OTel path.** Rejected. `oh_session_log` reaches the model provider's own endpoint, so it is a smaller disclosure than the OTel export, but it is default-on, it carries the workspace path and full message text, and the model provider does not need it to serve the conversation.

**Delete the OTel session channel from `oh-otel` too.** Deferred. `createSessionLogReporter` is public API of a surviving library package and now has no in-repository consumer; removing it is a separate simplification of `oh-otel`, not part of removing the reporting paths.

## Consequences

The harness no longer needs a user-facing telemetry opt-out, and the launchers no longer patch a row to honor one. `ProfileContext` loses `telemetryDisabledEnv`, and `app-boot` loses `resolveTelemetryPatch` with it.

`@orochi-network/oh-otel` keeps its session-log channel. It is a generic OTel service capability with no in-repository consumer; a future Session-reporting backend would mount it again unchanged.

Committed Sessions written by earlier builds keep their `session-log-deepseek/delivery-accepted` rows in their committed generation files, which are never rewritten. Reading one converts it through the V4-to-V5 edge, which drops those rows; the converted successor never contains them again. The released V0–V3 format references, the released version schemas, and the frozen package sources are unchanged, because they record what those versions wrote rather than what this build writes.

The archived [session-log upload default](../../archived/architecture/2026-09-14-session-log-upload-default.md), [bounded upload](../../archived/architecture/2026-09-24-bounded-session-log-upload.md), [telemetry revival](../../archived/feature/2026-07-23-session-telemetry-otel-revival.md), [feedback-gated telemetry default](../../archived/feature/2026-08-25-feedback-gated-telemetry-default.md), [explicit-feedback OTel upload](../../archived/architecture/2026-09-05-nonofficial-feedback-otel.md), [OTel byte limits](../../archived/architecture/2026-09-25-session-log-otel-byte-limits.md), and [request user-id header](../../archived/feature/2026-08-11-deepseek-request-user-id-header.md) notes record the removed decisions and their rationale.

## Verification

The direct-adapter tests assert that `x-orochi-harness-user-id` is absent from every recorded request header set, alongside the `user-agent` and Session-id assertions that survive. The `llm-orochi` Loader-composition test asserts the shipped `oh_plugin_packages` inventory and no `oh_session_log` field. The `/feedback` command and Loader-composition tests pin the acknowledgement text that names only the Session. `verify-cordis-config` and the bundle composition tests enumerate the shipped rows, so a remounted deleted row fails the gate.
