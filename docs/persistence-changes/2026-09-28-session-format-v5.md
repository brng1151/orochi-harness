---
description: "Records a persistence type transition and its compatibility acknowledgement."
kind: persistence-change
---

# 2026-09-28-session-format-v5

English | [中文](2026-09-28-session-format-v5.zh.md)

## Summary

Advances the declared SessionHeader.version from 4 to 5 and retires the event type session-log-deepseek/delivery-accepted, which no released V4 writer in this repository can produce any more.

## Table of Contents

- [Declaration](#declaration)
- [Compatibility](#compatibility)
- [Verification](#verification)
- [Dev Note](#dev-note)

<a id="declaration"></a>
## Declaration

```yaml persistence-change
schemaVersion: 1
id: 2026-09-28-session-format-v5
baseline: false
changes:
  - root: "SessionHeader"
    previous: "2026-09-16-session-format-v4"
    after: "22c6899a78214dd841c266348ae997027ef391174ddb21127f1b71dc1b362824"
    decision: version-bump
  - root: "event:session-log-deepseek/delivery-accepted"
    previous: "2026-09-11-initial"
    after: null
    decision: version-bump
```

<a id="compatibility"></a>
## Compatibility

V5 differs from V4 only by that retired event type: the header fields, the event envelope, and every other declared payload are unchanged, so the V4-to-V5 migration renumbers envelopes and remaps audited same-artifact sequence references without rewriting content. A released V4 log that still carries a delivery record becomes readable again because the adjacent migration drops that record instead of refusing the artifact; the watermark named an upload this build no longer performs, so its coordinates, payload, and position carry no meaning in the successor. Every other V4 event and the inherited cut survive, and a cut that followed a dropped record moves with it. A V5 artifact that still contains the record is refused as an unknown event type, so nothing writes or reinterprets it. Predecessor V0 through V4 readers, their codecs, and their recorded schemas are unchanged, and a V4 reader refuses a V5 log through the ordinary newer-format path.

<a id="verification"></a>
## Verification

npx vitest run packages/session/session-format-v4-to-v5: 25 tests passed with 100% statement, branch, function, and line coverage of the new package source. npx vitest run packages/session packages/test-support: 3740 tests passed, 0 failed.

<a id="dev-note"></a>
## Dev Note

None.
