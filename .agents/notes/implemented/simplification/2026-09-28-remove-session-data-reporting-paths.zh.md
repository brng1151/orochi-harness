# Agent Note：删除会话日志、会话遥测与匿名用户 id 上报路径

Status: implemented

[English](2026-09-28-remove-session-data-reporting-paths.md) | 中文

## Problem

三个已交付机制会把会话数据或稳定的安装标识送出本机，其中两个默认开启。安全审计发现，默认产品配置因此向外发送的内容超过模型提供方自身聊天 API 的需要。

- 未加任何配置的 `packages/session/session-log-deepseek` 会把尚未确认接收的完整会话日志后缀——每条消息、每个工具调用参数、每个工具结果以及工作区 `cwd`——附加到每个 Orochi 请求的 `oh_session_log` 字段。基础组合与 SDK-minimal 组合都挂载了它，因此 `enabled` 在所有进程中默认为 `true`。
- `packages/session/session-telemetry` 与 `packages/session/session-telemetry-otel` 会在用户执行 `/feedback` 之后，把规范会话前缀释放到 `https://harness-telemetry.deepseeksvc.com/v1/logs`，对所有提供方均如此。
- `packages/identity/anonymous-user-id` 生成一个随机 UUID，持久化在 `$OH_HOME/.anonymous-user-id`，并把它作为 `x-orochi-harness-user-id` 标头发送到每个 Orochi 请求，同时作为 OpenTelemetry 资源的 `user.id`。删除该文件会生成新身份，因此该标识符虽为假名，却稳定且可跨会话、跨重启、跨这些导出的所有接收方关联。

## Decision

`@orochi-network/oh-session-log-deepseek`、`@orochi-network/oh-session-telemetry`、`@orochi-network/oh-session-telemetry-otel` 与 `@orochi-network/oh-anonymous-user-id` 均已不存在，`identity/` 包组也随之清空。除模型提供方自身的聊天 API 外，harness 不再向任何端点发送会话内容、遥测数据或安装/用户标识。`x-orochi-harness-user-id` 标头已移除；`OH_TELEMETRY_MODE`、`OH_TELEMETRY_OTLP_URL`、`OH_TELEMETRY_DISABLED`、`session-log-deepseek.enabled` 与 `session-log-deepseek.maxBytes` 不再配置任何行为。`/feedback` 把反馈记录进会话日志并报告 Session id；它不再提及匿名用户，也不再共享任何数据。

`@orochi-network/oh-plugin-package-inventory-orochi` 及其 `oh_plugin_packages` 字段保留，拥有它的[请求扩展注册表决策](../architecture/2026-08-21-deepseek-llm-api-request-extensions.zh.md)也保留。该字段报告产生请求的 npm 包；它不携带会话内容、工作区路径，也没有用户或安装标识。通过 `user-agent` 的静态应用归属同样保留：它在每个请求上标识产品，不含任何按用户或按安装变化的值，并且是[归属决策](../architecture/2026-06-21-mandatory-app-attribution-headers.zh.md)的要求。`x-orochi-harness-session-id` 保留，因为它标注提供方本就在服务的那个对话，并且随该对话一起离开。

`session-log-deepseek/delivery-accepted` 事件类型不属于当前词汇表；[V5 退役决策](../../archived/architecture/2026-09-28-retire-delivery-watermark-with-session-format-v5.md)将其从写入方移除，并新增相邻边，使携带该记录的 V4 日志可以再次打开。已发布的 V0–V4 包仍然声明该类型，因为它们是记录这些版本所写入内容的冻结读取器。当前组合中没有任何内容写入它。

## Alternatives considered

**只把三条路径改为默认关闭而非删除。** 已否决。默认关闭的开关仍然是一个已交付的机制，带有配置界面、文档约定与环境变量，而且它们每一个都已经被组合或启动器代码至少改动过一次。只有删除才能让这项保证成为结构性的，而不是当前补丁文件的一个事实。

**保留这些包，只从随附组合中取消挂载。** 已否决，理由相同：代码、测试、配置目录与文档会继续被维护，却没有任何组合使用它们，而且自定义 profile 仍可重新挂载其中任意一个。

**保留匿名用户 id 用于关联，并把它挂在遥测开关之下。** 已否决。这是此处唯一标识整个安装、并对每个接收方和每个会话都有效的机制；把它留在一个需要显式启用的开关之后，恰好保留了本次删除要终结的那种可关联性。

**保留 `oh_session_log`，只删除 OTel 路径。** 已否决。`oh_session_log` 抵达模型提供方自身的端点，因此披露面比 OTel 导出更小，但它默认开启，携带工作区路径与完整消息文本，而模型提供方并不需要它来服务对话。

**一并删除 `oh-otel` 的 OTel 会话通道。** 延后处理。`createSessionLogReporter` 是存续库包的公开 API，如今在仓库内没有消费方；移除它属于对 `oh-otel` 的另一项简化，不属于本次删除上报路径的范围。

## Consequences

harness 不再需要面向用户的遥测退出开关，启动器也不再为满足该开关而改写配置行。`ProfileContext` 失去 `telemetryDisabledEnv`，`app-boot` 同时失去 `resolveTelemetryPatch`。

`@orochi-network/oh-otel` 保留其会话日志通道。它是一项通用 OTel 服务能力，仓库内没有消费方；将来的会话上报后端可以原样再次挂载它。

早期构建写入的已提交会话会在其已提交的代际文件中保留 `session-log-deepseek/delivery-accepted` 行，而这些文件从不被改写。读取时通过 V4 到 V5 边完成转换，该边会丢弃这些行；转换后的后继版本不再包含它们。已发布的 V0–V3 格式参考、各已发布版本的 schema 与冻结的包源码保持不变，因为它们记录的是那些版本写入了什么，而非本次构建写入了什么。

已归档的[会话日志上传默认值](../../archived/architecture/2026-09-14-session-log-upload-default.md)、[有界上传](../../archived/architecture/2026-09-24-bounded-session-log-upload.md)、[遥测恢复](../../archived/feature/2026-07-23-session-telemetry-otel-revival.md)、[反馈门控遥测默认值](../../archived/feature/2026-08-25-feedback-gated-telemetry-default.md)、[显式反馈 OTel 上传](../../archived/architecture/2026-09-05-nonofficial-feedback-otel.md)、[OTel 字节上限](../../archived/architecture/2026-09-25-session-log-otel-byte-limits.md)与[请求 user-id 标头](../../archived/feature/2026-08-11-deepseek-request-user-id-header.md)记录了被删除的决策及其理由。

## Verification

直连适配器测试断言 `x-orochi-harness-user-id` 不出现在任何已记录的请求标头集合中，与保留下来的 `user-agent` 和 Session id 断言并列。`llm-orochi` 的 Loader 组合测试断言随附的 `oh_plugin_packages` 清单存在且没有 `oh_session_log` 字段。`/feedback` 命令与 Loader 组合测试固定只标识 Session 的确认文本。`verify-cordis-config` 与各组合配置测试会枚举随附的配置行，因此重新挂载已删除的行会让该门禁失败。
