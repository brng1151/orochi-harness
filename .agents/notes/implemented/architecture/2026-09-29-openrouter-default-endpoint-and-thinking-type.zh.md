# Agent Note: OpenRouter 成为默认 Messages 端点，`thinking.type` 可配置

Status: implemented

[English](2026-09-29-openrouter-default-endpoint-and-thinking-type.md) | 中文

## 问题

随附的 Orochi 路由默认使用 `https://api.deepseek.com/anthropic`，目录为 `deepseek-flash` 与 `deepseek-v4-pro`，并把推理序列化为 `thinking: {type: enabled}` 加 `output_config: {effort}`。该 `thinking` 对象不带 `budget_tokens`，而原端点接受这种写法。把默认端点指向 OpenRouter 的 Messages API 不只是替换字符串：OpenRouter 规定 `thinking.type` 为 `enabled` 时必须带 `budget_tokens`，因此现有请求会在每一轮被拒绝。

## 决策

公共默认端点为 `https://openrouter.ai/api/v1`；按 [Messages 基址规则](../bug-fix/2026-09-15-messages-v1-base-url.zh.md)，严格匹配的末尾 `v1` 路径段会被复用，解析为 `/api/v1/messages`。默认目录公布 `xiaomi/mimo-v2.6-flash` 与 `xiaomi/mimo-v2.6-pro`，两者都支持文本与图片输入，各自的 `maxTokens` 为 131,072 token，因为该端点的输出上限低于配置层面 256,000 的默认值。两者仍沿用 1,000,000 token 的 `DEFAULT_CONTEXT_WINDOW`：该端点的模型列表显示这两个模型的上下文为 1,050,000 token、承载它们的提供方为 1,048,576 token，因此 `contextWindow * thresholdRatio` 处的压缩触发点会先于端点拒绝该轮请求。

推理以 `thinking: {type: adaptive}` 发送，强度放在 `output_config.effort`。OpenRouter 把 `output_config.effort` 作为 Messages 的一等字段，并归一化到其统一的 `reasoning.effort`，因此非 Claude 模型会以自己的词汇收到该强度；`adaptive` 把思考多少交给该强度决定，无需 token 预算。新增的 `thinkingType` Config 字段可为「端点读取不带 `budget_tokens` 的该值」的部署选择 `enabled`。`resolveAdapterOptions` 一次性解析该值，因此请求路径读到的是确定的 `thinkingType`，而不是在序列化中兜底。与 `thinking: disabled` 同时配置会在加载时失败，因为该策略下没有请求会思考。

DeepSeek Platform 登录被移除而非改指向：OpenRouter 没有对应的账号服务，用户通过模型设置页面提供 API Key。账号、账号平台、账号 LLM 路由、账号设置 UI 与账号控制器等包，Desktop 的 Platform 页面，以及 Desktop 强制更新策略均已删除。Desktop 欢迎窗口保留为仅含 API Key 的界面。此前关于账号登录、退出登录、额度充值和强制更新客户端的笔记所描述的功能不再随附。

两个默认条目都不声明 `systemPromptUpdate: in-history` 或 `toolUpdate`。OpenRouter 既未说明把历史中较晚的 `system` 消息读作有效系统提示词，也未说明从 `tool_addition` 块激活 `defer_loading` 工具，因此循环会重新声明完整提示词与工具列表。按模型声明这两种模式的部署仍可使用它们。

## 考虑过的替代方案

**发送 `thinking: {type: enabled, budget_tokens: N}`，并为每个强度配置预算。** 这直接满足 Anthropic 请求协议，但引入了无人需要的预算表；而且按 OpenRouter 的归一化规则，预算与强度无法同时到达非 Claude 模型——预算会被丢弃，强度胜出。`adaptive` 用零个新增可调项表达同一意图。

**把 `output_config` 放到配置开关之后。** 依证据否决：该字段属于 OpenRouter 的 Messages 请求，而非 DeepSeek 扩展，把它挡住会移除唯一承载强度的通道。

**保留 `mimo-flash` 这类简短目录 id。** 目录 id 原样传到协议，因此只有提供方自己的 slug 才能路由。友好别名需要一张适配器有意不持有的转换表。

## 结果

全新安装只需一个密钥即可连到 OpenRouter。指向原端点的部署同时设置 `baseURL` 与 `thinkingType: enabled` 即可继续工作。

默认放弃两项能力：可缓存的历史内提示词更新，以及增量工具激活。端点支持它们的部署在自己的 `models` 条目上声明即可恢复两者。

该端点不提供 Anthropic Files API，因此图片请求会尝试一次上传，得到 `FileResolutionFailure`，随后以内联 base64 重发请求。图片仍能发送，代价是每个图片请求多一次往返。

## 验证

`pnpm run test` 覆盖解析后的默认值、`thinkingType` 的协议取值以及加载期冲突；`pnpm run test:snapshot` 重放不变，因为每个已录制场景都固定自己的目录与模型。未对新端点发出真实请求——密钥由用户通过模型设置页面提供，因此真实 API 覆盖仍由 `OROCHI_API_KEY` e2e 承担。
