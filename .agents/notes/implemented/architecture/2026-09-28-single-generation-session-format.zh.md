# Agent Note: 本分支只发布一个 Session 格式代次

Status: implemented

[English](2026-09-28-single-generation-session-format.md) | 中文

## Problem

Session 格式通过五个相邻迁移包演进到 V5，每个包冻结一个已发布的物理 codec 以及两个版本之间的流式转换。读取 V2 session 需要运行 V0→V1→V2→V3→V4→V5 整条链；每个读取方、已记录 session 语料库、持久化后端和快照测试框架都背负这份历史。

本仓库是发布为 `orochi-network/orochi-harness` 的全新分支。它没有已发布的产品版本，没有早期构建写入的用户数据，因此对任何分支之前的 Session 产物都没有兼容性义务。这条链的代价是一套长期维护的子系统，其唯一产品是读取本分支永远不会遇到的文件。

## Decision

本分支只发布一个 Session 格式代次 V5，不携带迁移链。

- `SESSION_FORMAT_VERSION` 保持 5。存储头声明任何其他版本时，在读取事件体之前即被拒绝；读取头与恢复两条路径都如此，持久化存储抛出 `SessionFormatUnsupportedError`。
- 内置的 V5 物理 codec 与全部原生准入规则位于 `session-format-catalog`，由生成器根据写入器常量渲染。`session-format` 保留共享契约：目录工厂、JSON 辅助函数、错误类和规范文件名辅助函数。
- 已记录 session 语料库中每个父级/序位角色只保留一个代次。每个拥有场景选中的 fixture 都是当前写入器，语料库策略正是这样要求的。

## Alternatives considered

保留整条链是被否决的替代方案，理由如上。第二个替代方案——保留五个包但取消语料库策略的覆盖要求——更早即被否决：它保留了同样的维护成本，却移除了验证这条链仍然可用的检查。第三个方案是只读取用户首个 session 所指明的那一个分支之前版本，这是下文描述的重新引入路径，推迟到确有发布需要时再做。

## Consequences

分支之前构建写入的产物无法打开。拒绝信息会指明所存版本，保持文件不变，且在没有携带缺失边的构建前无法重试。

已记录 session 语料库从 491 个 fixture 缩减为 214 个：每个拥有场景的每个角色只保留一个当前写入器代次，语料库策略也只检查这一点。由于当前写入器从不输出顶层打包分块行，打包行的物理布局不再是可读形式，其专门覆盖也随产生它的边一同消失。

## We gave up

早期构建写入的 session 无法读取。用户看到的是指明所存版本的“不支持格式”拒绝，而不是静默丢失：任何内容都不会被原地重写、截断或迁移，源文件及其字节保持不变。

保留迁移链本可以维持这种可读性。但不值得为此永久维护五个包、逐边的准入与处置清单、持久化后端中的迁移发布路径、历史子目录前置依赖、一次性贡献者迁移命令，以及一份其主题本身就是这段历史的语料库策略。

将来若某个发布必须读取分支之前的 session，只为它需要的那个源版本重新加入对应的相邻边。它不会整体恢复整条链，也不会重命名或重写任何已提交的代次：它在未改动的源文件旁新增一个带版本名的后继文件，这正是[已发布格式迁移记录](../../archived/architecture/2026-08-31-released-session-format-migrations.md)在该场景下仍然描述的做法。

## Verification

`pnpm run test:snapshot` 从每个场景的当前写入器 fixture 重放全部已记录 session 场景。`pnpm run verify-session-format-catalog` 确认生成的目录只声明一个 codec 且没有迁移。`pnpm run verify-persistence-formats` 确认唯一的格式参考就是内置代次，`pnpm run verify-persistence-changes` 确认已接受的类型变更历史仍与声明的 schema 一致。
