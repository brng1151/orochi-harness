# Session 格式版本与发布状态

[English](session-format-status.md) | 中文

## 概述

本参考区分工作区写入器、已接受兼容性基线与最新已发布的 Session 格式。代码常量拥有写入器版本；下方定稿记录和发布记录分别标识已接受历史与发布证据。其他文档链接到这里，不重复这些值。

## 目录

- [单一真源](#sources-of-truth)
- [定稿记录](#finalization-record)
- [发布记录](#release-record)
- [更新记录](#updating-the-record)
- [开发备注](#dev-note)

<a id="sources-of-truth"></a>
## 单一真源

- **工作区写入器：**[核心 Session 类型](../packages/core/session/src/types.ts)中的 `SESSION_FORMAT_VERSION` 是代码中唯一手工维护的当前写入器版本号。[目录生成器](../scripts/gen-session-format-catalog.ts)据此生成唯一的内置 codec。包版本、codec 导出名称、fixture（测试前置数据）文件名或投影缓存版本都不是写入器版本的权威来源。
- **最新已发布格式：**下方记录中的 `latestReleasedVersion` 标识已发布的 Session 格式。本分支尚未发布任何产品，因此该值为 `0`；`evidenceTag` 指定确定当前写入器的前身发布线，而不是本分支的发布事实。双语副本按同一记录校验，不作为独立决策维护。
- **发布状态：**比较写入器常量与已核实的发布记录。相等表示写入器格式已经发布。写入器版本更高表示发布记录尚未收录它；独立的定稿记录标识已接受的兼容性基线。用较新分支中已核实的记录对比旧工作区时，较低的写入器版本表示较旧的写入器格式；本地一致性门禁会拒绝同一工作区内的这种大小关系。不另行维护 released 布尔值。在声明更高版本尚未发布前，必须核实是否已有产品发布推进了记录。

本分支是一条全新产品线：没有已发布的 Session 格式，没有历史用户数据，因此不声明已接受的兼容性基线、发布证据或迁移链；任何声明其他版本号的存储头都会被拒绝。[版本与真源决策](../.agents/notes/implemented/architecture/2026-08-10-session-log-version-mechanism.zh.md)拥有兼容性决策，[单一格式代次决策](../.agents/notes/implemented/architecture/2026-09-28-single-generation-session-format.zh.md)拥有无迁移链的读取器。

[生成的目录](persistence-catalog.zh.md)记录本构建唯一读写的格式。

<a id="finalization-record"></a>
## 定稿记录

```yaml session-format-finalization
latestFinalizedVersion: 5
```

V5 的已接受兼容性基线保存在[检查点](persistence-changes/finalized/v5.json)中。向后兼容的 schema 变更可以通过新的确认记录保留 V5。破坏性变更要求更高的写入器版本及自身的头版本转换。已接受的机器记录与变更后 schema 保持不可变。[检查点规则](persistence-changes/README.zh.md#compatibility-rules)规定比较方法。

定稿不冻结 V5 之后的每项新增，也不表示已发布。下方发布记录保留独立验证的已发布版本，本分支尚未推进该记录。普通注释、别名、源码位置，以及保留已接受含义的实现修复，不改变该基线。

<a id="release-record"></a>
## 发布记录

```yaml session-format-release
latestReleasedVersion: 0
evidenceTag: oh-v0.1.5-alpha.1
```

证据：本分支尚未发布任何产品。参考标签 `oh-v0.1.5-alpha.1` 指向写入器位于 `packages/core/session/src/types.ts` 的前身发布线；它是历史背景，不是本分支的发布事实。

<a id="updating-the-record"></a>
## 更新记录

实现结构性写入器变更时，一起更新代码常量与生成的目录；不要在产品发布前推进此发布记录。当产品首次发布更高的 Session 格式时，确认发布事实及对应标签的写入器，然后在同一次双语更新中推进本记录与证据标签。后续携带相同格式的产品发布无需改变此记录。开发主干上的记录绝不降低。

[文档标准测试](../scripts/doc-standard.spec.ts)检查记录结构、双语一致性、证据标签及写入器路径一致性，以及文档中的已发布版本不高于工作区写入器。这个无密钥检查不会查询 GitHub，也不能证明记录是最新的；核实发布事实仍属于发布更新的一部分。

一般行为使用“当前格式”和“下一版本”等表述。固定迁移的输入与输出、协议 schema、历史证据及针对特定版本的测试保留明确版本号。[格式版本实操手册](cookbook/adding-a-session-format-version.zh.md)用 N 表示最新已定稿或已发布格式，用 N+1 表示其后继版本。

<a id="dev-note"></a>
## 开发备注

无。
