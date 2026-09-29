# Agent Note: Retire the delivery acceptance watermark with Session format V5

Status: implemented
Archived: 2026-09-28

[English](2026-09-28-retire-delivery-watermark-with-session-format-v5.md) | 中文

## Problem

`session-log-deepseek/delivery-accepted` 曾是 V4 事件类型。它记录 Session 日志已被托管上传路径接纳，连同其所属的 Session id 以及上传覆盖到的最后一个序号。上传相关包已从当前组合中移除，因此没有写入方产生该记录，但已发布的 V4 产物中仍然含有它。

[上报路径移除决策](../simplification/2026-09-28-remove-session-data-reporting-paths.zh.md)曾假定冻结的 V0–V4 读取方已经足够：它把该事件留在那些包中的声明里，并预期不再理解该类型的构建仍能读取每一个已提交日志。这一假定并不成立。V4 读取路径会针对已安装的 `SessionEventMap` 校验已发布产物，而从当前词汇表中删除该声明使得包含该记录的 V4 日志在恢复时以 `SessionFormatUnsupportedMigrationError` 失败。一个更早版本写入的日志不能因为某项功能消失而变得不可读，并且当前组合中没有任何其他部分写入或消费该记录。

该记录也不是普通 payload。它的 `seq` 参与产物的稠密编号，其他事件通过 `sourceEventSeqs`、替换端点、命令完成、标题引用、压实跨度和图片卸载目标引用更早位置。因此丢弃它会重新编号其后的所有 envelope，并使其后每一个同一产物内的引用失效，包括已继承切点。

## Decision

`SESSION_FORMAT_VERSION` 提升到 5，并在相邻链中加入 `session-format-v4-to-v5` 边。V5 的编码、header、envelope 与 payload 规则与 V4 完全相同，唯一差异是该事件类型不存在。该边移除每一条 `session-log-deepseek/delivery-accepted` 记录，无论其记录了哪个 `sessionFormatVersion`，随后稠密地重新编号 envelope，并把经审计的同一产物内引用改写为目标坐标。其他每个事件、payload、时间戳与标识符都保留，继承切点随存活前缀移动。

被移除的记录既不转换，也不作为不透明 JSON 保留，也不会换名重新编码。stage 不执行 delivery 归属、`throughSeq` 或 `sessionId` 检查：该水位标记指向本版本从不执行的上传，而无法影响 V5 产物的记录，其坐标也没有后继版本可以兑现。重新校验它只会因为 V5 读取方已无用途的理由拒绝日志。

仍携带该记录的 V5 产物会作为未知事件类型被拒绝，因此在读出与写入两侧都强制了退役。[已发布格式策略](2026-08-31-released-session-format-migrations.zh.md)拥有本决策遵循的不可变规则：V0–V4 包、其 README 与已记录 schema 均未改动，V5 是按版本命名的后继，而不是对已提交代际的编辑。

## 备选方案

**在当前 `SessionEventMap` 中保留该事件声明并继续不拒绝任何内容。** 这能保持该类型可读，但会在未来每种格式的词汇表中留下一套面向写入方的死协议，而它描述的上传路径已经消失。[事件名注册决策](2026-08-30-retain-ignorable-external-session-events.zh.md)出于另一个理由已否决注册；保留一个已死的注册类型是同样的错误，且没有收益。

**转换时把该记录标记为 `ignorable: true` 而不是移除。** 这样能保留行并避免重新编号，但会让每一条转换后的日志永久携带一个死记录类型，并仍迫使读取方解释一个已无含义的水位标记。退役应当表现为缺失，而不是永久被容忍的幽灵。

**保留该记录，并为 V5 单独定义 delivery 归属规则。** 这样能保持 V4 的拒绝行为，代价是在新包中重新实现冻结的代际语义，从而让 V4 日志因为一个 V5 格式已不再建模的水位标记而被拒绝。

**通过修正词汇表重新开放 V4，而不是新增版本。** 编辑冻结的 V4 包会改变已发布的内容，而且已接受的 V4 检查点已记录了后续读取方依赖的摘要。

## 后果

每一个已发布的 V0–V4 日志重新可读，包含该水位标记的 V4 日志会转换为不含它的 V5 产物。转换后的 Session 不再记录更早版本曾为它接纳过哪些上传；鉴于当前组合不产生该信息，因此不会丢失新的来源信息。JSONL 后端与处理其他每条相邻边一样，把 V5 后继版本发布在未改动的先代文件旁边。

已记录 Session 的比较不再需要 delivery 代际 token。`normalizeSessionSnapshots` 在比较前恢复每个带版本号的输入，而恢复后的输入已无法携带被退役记录，因此 `nativeWriterOutput` 选项与 `{{sourceSessionFormatVersion}}` 替换已无适用对象并被移除。`normalizeSessionFormatMetadata` 保留其记录形式供线路通知使用，因为线路通知不经迁移过程即被比较。

V4 的 delivery 归属关系在 V5 中没有对应项。[V3 到 V4 规范](../../../../packages/session/session-format-v3-to-v4/README.zh.md)中的 V4 delivery 守卫仍是 V4 读取方所做检查的冻结记录，而 [V4 到 V5 规范](../../../../packages/session/session-format-v4-to-v5/README.zh.md)说明该边丢弃记录而不重新检查它。

## 验证

新包自身的测试套件通过 25 个测试，其源码的语句、分支、函数与行覆盖率均为 100%：任意位置的丢弃、稠密重新编号、不透明扩展的保留、每个经审计的引用成员、移动后的已继承切点、一致与不一致两种情况，以及全部拒绝路径。组合目录、JSONL 发布与已提交语料套件与冻结的 V0–V4 边测试一同通过；后者现在断言已安装的链会丢弃该记录，而 V3 到 V4 边仍在自身坐标中保留并检查它。

`pnpm run verify-persistence-changes` 接受 `docs/persistence-changes/2026-09-28-session-format-v5.md` 中记录的转换：`SessionHeader.version` 与被移除的事件根，二者均为版本提升。`pnpm run verify-persistence-formats` 验证了在本工作树写入器推进之前、由本工作树的 V4 声明创建的已归档 V4 参考。
