---
description: "记录持久化类型更改及其兼容性确认。"
kind: persistence-change
---

# 2026-09-28-session-format-v5

[English](2026-09-28-session-format-v5.md) | 中文

## 概述

将声明的 SessionHeader.version 从 4 提升到 5，并退役事件类型 session-log-deepseek/delivery-accepted——本仓库中已发布的 V4 写入方已不再写入该事件。

## 目录

- [声明](#declaration)
- [兼容性](#compatibility)
- [验证](#verification)
- [开发备注](#dev-note)

<a id="declaration"></a>
## 声明

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
## 兼容性

V5 与 V4 的唯一差异是被退役的事件类型：header 字段、事件 envelope 以及其他所有已声明 payload 均不变，因此 V4→V5 迁移只重新编号 envelope 并重映射同一产物内经审计的序号引用，不重写内容。仍带有 delivery 记录的已发布 V4 日志重新可读，因为相邻迁移会丢弃该记录而不是拒绝整个产物；该水位标记指向本版本已不再执行的上传，因此其坐标、payload 与位置在后续版本中没有含义。其他每个 V4 事件与继承截点都会保留；若截点位于被丢弃记录之后，它会随之移动。仍包含该记录的 V5 产物会作为未知事件类型被拒绝，因此不会有任何写入或重新解释。V0 至 V4 的前代读取方、其 codec 与已记录 schema 均未改动，而 V4 读取方通过常规的新版本路径拒绝 V5 日志。

<a id="verification"></a>
## 验证

npx vitest run packages/session/session-format-v4-to-v5：25 个测试通过，新包源码的语句、分支、函数与行覆盖率均为 100%。npx vitest run packages/session packages/test-support：3740 个测试通过，0 个失败。

<a id="dev-note"></a>
## 开发备注

无。
