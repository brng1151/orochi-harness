# Agent Note: OpenRouter is the default Messages endpoint, and `thinking.type` is configurable

Status: implemented

English | [中文](2026-09-29-openrouter-default-endpoint-and-thinking-type.zh.md)

## Problem

The shipped Orochi route defaulted to `https://api.deepseek.com/anthropic` with a `deepseek-flash` and `deepseek-v4-pro` catalog, and it serialized reasoning as `thinking: {type: enabled}` beside `output_config: {effort}`. That `thinking` object carries no `budget_tokens`, which the endpoint accepted. Pointing the default at OpenRouter's Messages API needs more than new strings: OpenRouter documents `budget_tokens` as required whenever `thinking.type` is `enabled`, so the existing request would be rejected on every turn.

## Decision

The public default endpoint is `https://openrouter.ai/api/v1`, whose exact final `v1` segment the [Messages base-URL rule](../bug-fix/2026-09-15-messages-v1-base-url.md) reuses, resolving to `/api/v1/messages`. The default catalog advertises `xiaomi/mimo-v2.6-flash` and `xiaomi/mimo-v2.6-pro`, both text- and image-capable, each with a 131,072-token `maxTokens` because the endpoint caps completions below the profile-wide 256,000 default.

Reasoning is sent as `thinking: {type: adaptive}` with the effort in `output_config.effort`. OpenRouter keeps `output_config.effort` as a first-class Messages field and normalizes it to its unified `reasoning.effort`, so a non-Claude model receives the effort in its own vocabulary; `adaptive` leaves the amount of thinking to that effort and needs no token budget. A new `thinkingType` Config field selects `enabled` for a deployment whose endpoint reads that value without `budget_tokens`. `resolveAdapterOptions` resolves the value once, so the request path reads a concrete `thinkingType` rather than defaulting inside serialization. Configuring it together with `thinking: disabled` fails at load, because no request thinks under that policy.

The DeepSeek Platform sign-in is removed rather than repointed: OpenRouter has no equivalent account service, so users supply an API key through the Models settings page. The account, account-platform, account LLM route, account settings UI, and account controller packages, the Desktop Platform pages, and the Desktop mandatory-update policy are deleted. The Desktop welcome window remains as an API-key-only screen. Earlier notes on account login, sign-out, quota top-up, and the mandatory-update client describe features that no longer ship.

Neither default entry declares `systemPromptUpdate: in-history` or `toolUpdate`. OpenRouter documents neither reading a later in-history `system` message as the effective system prompt nor activating a `defer_loading` tool from a `tool_addition` block, so the loop re-declares the full prompt and tool list. Both modes remain available to a deployment that declares them per model.

## Alternatives considered

**Send `thinking: {type: enabled, budget_tokens: N}` with configurable per-effort budgets.** This satisfies the Anthropic request protocol directly, but it adds a budget table nothing asks for and, per OpenRouter's normalization, a budget and an effort cannot both reach a non-Claude model — the budget is dropped and the effort wins. `adaptive` expresses the same intent with no new tunable.

**Gate `output_config` behind configuration.** Rejected on evidence: the field is part of OpenRouter's Messages request, not a DeepSeek extension, so gating it would remove the only channel that carries the effort.

**Keep short catalog ids such as `mimo-flash`.** The catalog id passes through to the wire, so only the provider's own slug routes. A friendly alias would need a translation table the adapter deliberately does not have.

## Consequences

A fresh install reaches OpenRouter with no configuration beyond a key. Deployments pointed at the previous endpoint keep working by setting `baseURL` and `thinkingType: enabled` together.

Two capabilities are given up by default: cached in-history prompt updates and incremental tool activation. A deployment whose endpoint supports them declares them on its own `models` entries and recovers both.

The endpoint serves no Anthropic Files API, so an image request attempts one upload, takes `FileResolutionFailure`, and repeats the request with inline base64. Images still send, at one wasted round trip per image request.

## Verification

`pnpm run test` covers the resolved defaults, the `thinkingType` wire values, and the load-time conflict; `pnpm run test:snapshot` replays unchanged, because every recorded scenario pins its own catalog and model. No live request was made against the new endpoint — the key is user-supplied through the Models settings page, so real-API coverage stays with `OROCHI_API_KEY` e2e.
