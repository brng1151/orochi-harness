# Loadable Harness plugin packages

This file is GENERATED from workspace manifests (`scripts/gen-plugin-packages.ts`) and verified fresh by `pnpm run verify-plugin-packages` (part of `doc-sync`); do not edit it by hand.

Every package below exports a Cordis plugin that a bundle patch can name in a Loader row. `Config` marks packages whose row accepts a `config` mapping; query `Config.listConfigs` through `cordis_inspect_query` (filter by `name`, then query the `entry` id) for the mounted schema. Packages under `experimental` are pre-stable.

## acp

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-acp` | yes | Automation-only Agent Client Protocol server for driving Orochi Harness agents over JSON-RPC stdio |

## api

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-api-gateway` | yes | Typert Remote Host dispatcher and Client API endpoint |
| `@orochi-network/oh-api-job-controller` | yes | Job Remote observation stream and the reference-counted client job-output service |
| `@orochi-network/oh-api-remotes` | no | Remote BFF assembly for application-selected Host capabilities |
| `@orochi-network/oh-api-session-controller` | yes | Session Remote commands, cold reads, and live control transport |
| `@orochi-network/oh-api-settings-controller` | yes | Remote owner for the configuration surfaces over the settings-domain seams |
| `@orochi-network/oh-api-terminal-controller` | yes | Session-owned interactive terminals with shell discovery, screen recovery and typed Remote control |
| `@orochi-network/oh-api-workspace-controller` | yes | Workspace Remote commands and reconnect-safe state transport |
| `@orochi-network/oh-api-workspace-files` | yes | Workspace file service and Client resource provider: bounded reads, directory listing, and live metadata over the workspaceFiles Remote namespace |

## attachment

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-attachment-local` | yes | Private content-addressed OH_HOME attachment storage |

## boot

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-config-editor` | no | Persist plugin configuration through profile patches and Loader reconciliation |
| `@orochi-network/oh-hmr` | yes | Coordinated module and profile configuration hot reload |
| `@orochi-network/oh-plugin-manager` | yes | Current-profile plugin and bundle management shared by oh CLI, Web and agent tools |

## browser-use

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-browser-use` | no | Exclusive named browser-use provider registration |

## bundle

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-acp-app` | no | The oh ACP profile bundle: automation-only JSON-RPC stdio and process lifecycle over oh-base |
| `@orochi-network/oh-headless` | yes | The oh one-shot bundle: a direct core Agent/Session runner over oh-base with no Host, HTTP, or browser layer |
| `@orochi-network/oh-sdk-app` | yes | The oh SDK profile bundle: stdio JSON-RPC serving and process lifecycle over oh-base |
| `@orochi-network/oh-web-app` | yes | The oh browser-surface bundle: the web patch layer over oh-base plus the runtime glue plugin (frontend dist serving, web-surface prompt, bash runtime variables, URL line) |

## client

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-client-connection` | yes | Authenticated RPC transport and generation lifecycle |
| `@orochi-network/oh-client-file-upload` | no | Agent-scoped browser file upload, streaming intake, and staged receipt service |
| `@orochi-network/oh-client-hmr` | yes | Web client graph synchronization and rebuilt-bundle reload transport |
| `@orochi-network/oh-client-locale` | no | Locale plugin: Host-backed preference, extensible language catalog, browser fallback, and typed built-in dictionaries |
| `@orochi-network/oh-client-modules` | no | Client module system, dual-face: node half composes the __OH_BOOT__ entry graph (incremental oh.client scan, bundle route, index tap, webPlugins service); browser half is the lazy-CJS module table the vendored cordis Loader consumes as its internal seam |
| `@orochi-network/oh-client-resources` | no | Unified client resource model: protocol-registered providers turn URL addresses into live values, consumed through the useResource global standard hook |
| `@orochi-network/oh-client-shortcuts` | yes | Application keyboard command registry and physical-key routing |
| `@orochi-network/oh-client-ui-agent-preset` | no | Agent-preset surfaces: the default for later sessions, this session's seat, and the composition editor |
| `@orochi-network/oh-client-ui-approval` | no | Approval composer takeover over the scoped Remote Event waterfall |
| `@orochi-network/oh-client-ui-attachment` | no | Dynamic attachment presentation plugin for conversation input, message-image, and trajectory image slots |
| `@orochi-network/oh-client-ui-brand-official` | no | Official Orochi Harness brand occupants for the Web client's sidebar slots |
| `@orochi-network/oh-client-ui-chat` | no | Chat Conversation target, node definitions, renderers, and details surface |
| `@orochi-network/oh-client-ui-commands` | no | Client command surface: global directory cache, '/' source, three command UI kinds, popupSelect registry |
| `@orochi-network/oh-client-ui-conversation` | no | Target-neutral Conversation assembly, shell, composer, queue, and view navigation |
| `@orochi-network/oh-client-ui-deliverables` | no | Changed-files card with per-file comparison tabs, delivery cards, and clickable final-response file references for Web |
| `@orochi-network/oh-client-ui-directory-picker-browse` | no | In-app directory browsing surface: the workspace directory-flow owner rendering the host's listing and creation primitives |
| `@orochi-network/oh-client-ui-directory-picker-native` | no | Native directory-picker surface: the renderless workspace directory-flow occupant driving the local Desktop or Host OS chooser |
| `@orochi-network/oh-client-ui-goal` | no | Session goal surface: GoalBar docked above the composer, read from the goal session projection |
| `@orochi-network/oh-client-ui-input-trigger` | no | Input trigger pipeline: '/' and '@' detection, candidate menu, pick routing to registered sources |
| `@orochi-network/oh-client-ui-jobs` | no | Session-header background-job list with on-demand streaming record panels |
| `@orochi-network/oh-client-ui-layout` | no | Shell plugin: three-column AppFrame with drag handles, ctx.layout viewing-state service (navigation + panels) |
| `@orochi-network/oh-client-ui-message-feedback` | no | The Web feedback surface: per-message Like/Dislike in the assistant-message action strip and the feedback dialog behind both ratings and /feedback, backed by the messageFeedback and sessionFeedback Host Remotes |
| `@orochi-network/oh-client-ui-model-selection` | no | Model selection over the shared model catalog, Session projection, and session.selectModel |
| `@orochi-network/oh-client-ui-open-in-app` | no | Web "Open In..." controls: the Session-header split button opening the workspace directory in an installed application, and the document preview's default-application controls for one file |
| `@orochi-network/oh-client-ui-permission-presets` | no | Permission surfaces: a new-session default in General settings and a current-session /permission popup over the permissions projection |
| `@orochi-network/oh-client-ui-plan` | no | Plan mode controls, persistent transcript plan cards, and sidebar Markdown previews |
| `@orochi-network/oh-client-ui-plugin-manager` | yes | Plugin management for the oh web client: the sidebar Plugins panel installs, enables, disables, retries, and composes installed plugin packages |
| `@orochi-network/oh-client-ui-reference` | no | Unified Web @file and @session reference source |
| `@orochi-network/oh-client-ui-renderer` | no | Browser UI renderer: React slot bindings, ctx.uiRenderer, and the assembled application root |
| `@orochi-network/oh-client-ui-schedule` | no | Host task management page and Session reminder catalog |
| `@orochi-network/oh-client-ui-session` | no | Session Controller adapter for React and session-scoped slots |
| `@orochi-network/oh-client-ui-settings` | no | Settings domain base plugin: shared configuration forms and the canonical settings slot-type contract |
| `@orochi-network/oh-client-ui-settings-agent-loop` | no | Settings page of the agent loop on the oh web client's Plugins page: the parallel tool-call cap of the agent-loop namespace |
| `@orochi-network/oh-client-ui-settings-general` | no | Settings ownerless-copy and product onboarding plugin: the General section, shell trigger/header chrome content, settings dictionaries, and the versioned welcome notice |
| `@orochi-network/oh-client-ui-settings-models` | yes | Models settings and shared product-onboarding dialogs over existing settings and credential joins |
| `@orochi-network/oh-client-ui-settings-plugin-inventory` | no | Read-only Cordis Loader inventory tab in Web Plugins settings |
| `@orochi-network/oh-client-ui-settings-plugins` | no | Built-in plugins settings section for the oh web client: the Settings navigation entry and the tab chrome feature-owned tabs register into |
| `@orochi-network/oh-client-ui-settings-shell` | no | Settings page of the shell executor on the oh web client's Plugins page: the command timeout and the per-stream output cap of the shell namespace |
| `@orochi-network/oh-client-ui-settings-subagent` | no | Settings page of Subagent delegation on the oh web client's Plugins page: recursion depth, parallel capacity, and the models agents may choose for subagents |
| `@orochi-network/oh-client-ui-settings-web-search` | no | Settings page of the Orochi web-search provider on the oh web client's Plugins page: its API key, endpoint, and per-request search budget |
| `@orochi-network/oh-client-ui-shortcuts` | no | Keyboard shortcut reference, recording, and local preference editing |
| `@orochi-network/oh-client-ui-sidebar` | no | Sidebar plugin: session multi-level tree, search, grouping, state dots |
| `@orochi-network/oh-client-ui-sidebar-browser` | no | Sandboxed Web browser tabs for the right Sidebar |
| `@orochi-network/oh-client-ui-sidebar-documentpreview` | yes | Extensible Sidebar previews for Office documents, spreadsheets, Markdown, code, images, PDF, HTML, and plain text |
| `@orochi-network/oh-client-ui-sidebar-files` | no | Workspace file tree tab type for the right Sidebar: lazy directory listing over the workspaceFiles Remote namespace, opening files into the Sidebar |
| `@orochi-network/oh-client-ui-sidebar-right` | no | Right Sidebar: the docking surface's session-bound state, its panel and header expand control, and the navigation service over it |
| `@orochi-network/oh-client-ui-sidebar-terminal` | no | Interactive shell tabs for the right Sidebar |
| `@orochi-network/oh-client-ui-skill` | no | Web skill references and the dedicated skill tool row |
| `@orochi-network/oh-client-ui-subagent` | no | Subagent conversation catalog, continuation routing UI, and '@' reference source |
| `@orochi-network/oh-client-ui-theme` | yes | Theme plugin: Host bootstrap for the pre-plugin palette; DOM-free ThemeRuntime for light/dark/system state; --oh-* token styles and Appearance settings row |
| `@orochi-network/oh-client-ui-tool` | no | Client Tool call-tree renderer and keyed per-tool presentation slot |
| `@orochi-network/oh-client-ui-trajectory` | no | Trajectory event ledger with an interactive timing overview: pure-consumer plugin registering into the conversation ViewMap (no service) |
| `@orochi-network/oh-client-ui-user-questions` | no | Web ask_user_question composer takeover and plan-review presentation UI |
| `@orochi-network/oh-client-ui-workflow-run` | no | Durable workflow-run Conversation Node and nested member disclosure for oh web |
| `@orochi-network/oh-client-ui-workspace` | no | Workspace picker plugin: one WorkspacePicker registered into the sidebar and empty-state workspace slots |

## compaction

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-command-compact` | no | Human-facing slash command for explicit session compaction |
| `@orochi-network/oh-compaction-basic` | yes | Token-meter-driven compaction policy and LLM summarization backend for the Orochi Harness |
| `@orochi-network/oh-compaction-image-offload` | no | Durable image offload for image-capable routes: replace over-budget request images with placeholders and retry |
| `@orochi-network/oh-compaction-tool-result-pruner` | yes | Replay-safe model-free head/middle/tail pruning for tool-result surface nodes |

## computer-use

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-computer-use` | no | Exclusive named computer-use provider registration |

## context

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-agent-instructions` | yes | Workspace context loader for AGENTS.md/CLAUDE.md instruction files |
| `@orochi-network/oh-file-reference-local` | yes | Local-filesystem ctx.fileReferences provider with bounded fuzzy indexes |
| `@orochi-network/oh-session-reference` | yes | Cross-session snapshot references and durable untrusted model context (ctx.sessionReferenceResolver) |
| `@orochi-network/oh-time-context` | yes | Durable per-step context with the current time and elapsed time |
| `@orochi-network/oh-tmux-context` | yes | Opt-in durable per-step context with this agent's tmux pane and window location |

## core

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-agent` | no | Agent interface, registry, initiator scope, and event vocabulary for the Orochi Harness |
| `@orochi-network/oh-agent-default-model` | yes | Default model selection shared by Agent entry points |
| `@orochi-network/oh-agent-loop` | yes | The concrete agent loop plugin for the Orochi Harness |
| `@orochi-network/oh-agent-tool-presentation` | yes | Agent-plane presentation selector: composes one agent's tools as PTC mode, native, or both |
| `@orochi-network/oh-session` | no | Event-sourced session store for the Orochi Harness |
| `@orochi-network/oh-system-prompt` | yes | System prompt assembly registry for the Orochi Harness |
| `@orochi-network/oh-tools` | yes | Tool registry and execution pipeline for the Orochi Harness |

## credentials

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-authorization` | no | Authorization seam (ctx.authorization): plugin-owned flows that obtain a credential through a conversation with the human |
| `@orochi-network/oh-credentials-local` | yes | File-backed credentials provider ($OH_HOME/.env under the live process environment) for the Orochi Harness |

## deliverables

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-tool-present` | yes | Explicit workspace file delivery declarations for the Orochi Harness |
| `@orochi-network/oh-workspace-changes` | yes | Per-turn workspace file changes recorded from git working-tree snapshots and whole-file captures, with per-file comparisons, for the Orochi Harness |

## document

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-office-to-pdf` | yes | Shared Office-to-PDF conversion with bounded queues and caching |

## experimental

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-experimental-agent-team` | yes | Implicit-root Agent Teams roster, durable peer mailbox, and shared task DAG |
| `@orochi-network/oh-experimental-api-speech-to-text` | yes | Authenticated experimental speech transcription for browser clients |
| `@orochi-network/oh-experimental-auto-review` | no | Per-tool LLM authorization review for the Orochi Harness Auto permission preset |
| `@orochi-network/oh-experimental-browser-use-chrome-devtools-mcp` | yes | Experimental per-Session Chromium browser tools through chrome-devtools-mcp |
| `@orochi-network/oh-experimental-browser-use-playwright-mcp` | yes | Experimental per-Session Chromium browser tools through @playwright/mcp |
| `@orochi-network/oh-experimental-browser-use-stagehand-native` | yes | Experimental Stagehand browser tools with separately configured native models |
| `@orochi-network/oh-experimental-client-ui-agent-team` | no | Web Agent Teams roster, task board, and teammate navigation |
| `@orochi-network/oh-experimental-client-ui-voice-input` | no | Record speech and insert editable text into the conversation draft |
| `@orochi-network/oh-experimental-computer-use-cua-driver-mcp` | yes | Experimental computer use through an installed Cua Driver MCP executable |
| `@orochi-network/oh-experimental-computer-use-cua-driver-native` | no | Experimental computer-use provider embedding the Cua Driver native npm SDK |
| `@orochi-network/oh-experimental-inspector` | yes | Experimental cross-realm CDP hub for Host debugging and Client Runtime inspection |
| `@orochi-network/oh-experimental-ptc-runtime-python` | yes | CPython subprocess implementation of the Orochi Harness PTC execution seam |
| `@orochi-network/oh-experimental-speech-to-text` | yes | Experimental speech recognition with independently selectable providers |
| `@orochi-network/oh-experimental-speech-to-text-sensevoice` | yes | Local SenseVoice ONNX transcription with a managed sherpa-onnx process |
| `@orochi-network/oh-experimental-tool-agent-team` | yes | Scoped model-facing Agent Teams tools over ctx.agentTeams |

## extensions

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-client-ui-cordis` | no | Cordis dynamic-plugin definition card: the keyed cordis_define tool row with its run/stop switch |
| `@orochi-network/oh-cordis-client-runner` | no | Browser half of dynamic dual-half plugin packages: event subscription, closure evaluation, guard facade, and loader entries |
| `@orochi-network/oh-cordis-host-runner` | yes | Dynamic package definition registry, host-half sandbox lifecycle, and invoke handler table for model-mounted dual-half packages |
| `@orochi-network/oh-tool-cordis` | no | Read-only runtime API inspection for Harness plugin development |

## feedback

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-command-feedback` | no | Log-only session feedback: the record event, the sessionFeedback Host Remote, and the human-facing slash command |
| `@orochi-network/oh-message-feedback` | yes | Canonical Session-log ratings and notes for finalized assistant messages |

## fs

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-fs-local` | yes | Local-filesystem implementation of the Orochi Harness filesystem seam (ctx.fs) |
| `@orochi-network/oh-fs-observation-policy` | no | File-context policy plugin for the Orochi Harness — observed-state, read-before-edit, and version-guarded write/edit added over the ctx.fs provider seam through the fs/* event gate (no service API) |
| `@orochi-network/oh-fs-sandbox` | yes | Sandbox-enforcing implementation of the Orochi Harness filesystem seam: fences write/edit by the per-call sandbox mode (read-only denies mutation, workspace-write contains it to the workspace + temp roots) while reads pass through |
| `@orochi-network/oh-tool-fs` | yes | Model-facing filesystem tools (read, write, edit) over the Orochi Harness filesystem seam (ctx.fs) |
| `@orochi-network/oh-tool-fs-search` | yes | Model-facing filesystem discovery tools (glob, grep) backed by the packaged ripgrep binary (@vscode/ripgrep) |
| `@orochi-network/oh-tool-str-replace-editor` | yes | Model-facing view, create, literal replace, and line insert tool over the Harness filesystem service |

## goal

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-command-goal` | no | Human-facing slash command for persisted same-session goals |
| `@orochi-network/oh-goal` | yes | Event-sourced same-session goal state and lifecycle service for the Orochi Harness |
| `@orochi-network/oh-goal-round-driver` | no | Race-fenced same-session goal-round driver |
| `@orochi-network/oh-tool-goal` | yes | Model-facing same-session goal tools with execution-time authority checks |

## guard

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-repeat-tool-reminder` | yes | Repeat-tool-call guard plugin: advisory reminders when an agent loops on identical tool calls |
| `@orochi-network/oh-tool-call-timeout-policy` | no | Tool-call timeout policy: a tools/execute wrapper that arms a per-tool deadline on exec.signal and returns TOOL_TIMEOUT when it wins |

## hooks

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-hooks-claude-code` | yes | Bridge plugin: run a Claude Code hooks.json / settings hook config on the Orochi Harness interception seams |
| `@orochi-network/oh-hooks-codex` | yes | Bridge plugin: run a Codex hooks.json hook config on the Orochi Harness interception seams |

## host

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-host-directory-picker-auto` | no | Adaptive chooser of the directory-picker seam: resolves the host situation at boot and mounts the native or browse backend for the Orochi Harness web GUI host |
| `@orochi-network/oh-host-directory-picker-browse` | yes | In-app browsing backend of the directory-picker seam (listing/creation primitives over the host filesystem) |
| `@orochi-network/oh-host-directory-picker-native` | no | Native-OS-chooser backend of the directory-picker seam for the Orochi Harness web GUI host |
| `@orochi-network/oh-host-frontend-static` | yes | SPA dist server for the Web shell: owns the webserver fallback seat, serving explicit index entries and static assets with traversal rejection and 404 misses |
| `@orochi-network/oh-host-open-in-app` | yes | Host half of open-in-app: resolved application catalog, icons, and the launch endpoint as three webServer routes |
| `@orochi-network/oh-host-plugin-inventory` | no | Read-only Remote projection of current Cordis Loader plugin state |
| `@orochi-network/oh-host-webserver` | yes | Web route-registration plugin: HTTP and upgrade routes, index transform taps, and static dist fallback; knows no harness concepts |

## interaction

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-commands` | no | Plugin-owned human command registry for Orochi Harness UIs |
| `@orochi-network/oh-permission-presets` | yes | User-facing permission presets (ctx.permissionPresets) for the Orochi Harness: one product-level Permissions select bundling the sandbox-mode and approval-policy knobs, written through to their own session events |
| `@orochi-network/oh-tool-ask-user` | no | Model-facing ask_user_question tool over the ctx.userQuestions seam |
| `@orochi-network/oh-user-approval` | yes | User-approval seam (ctx.approval) for the Orochi Harness: one-shot permission decisions dispatched to composed answerers over the approval/request waterfall, fail-closed by default |
| `@orochi-network/oh-user-questions` | no | Abstract user-questions seam (ctx.userQuestions) for asking the human during agent runs |

## jobs

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-jobs-local` | yes | Process-local implementation of the Orochi Harness background job registry seam |
| `@orochi-network/oh-tool-jobs` | yes | Model-facing background job control tools (job_output, job_list, job_kill) over the ctx.jobs registry |

## llm

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-llm` | no | Provider-neutral LLM service interface for the Orochi Harness |
| `@orochi-network/oh-llm-orochi-api-key` | yes | Orochi api-key provider authentication and discovery |
| `@orochi-network/oh-llm-pi-ai` | yes | pi-ai-backed Orochi adapter for the Orochi Harness LLM seam (design-verification twin of oh-llm-orochi) |
| `@orochi-network/oh-llm-retry` | yes | Provider-routed LLM request retry policy for the Orochi Harness |
| `@orochi-network/oh-orochi-llm-api-extensions` | no | Additive request-field registry for the official Orochi LLM API adapter |
| `@orochi-network/oh-plugin-package-inventory-orochi` | yes | Active Loader-backed plugin package inventory for official Orochi LLM API requests |
| `@orochi-network/oh-token-meter` | yes | Replay-aware token measurement service (ctx.tokenMeter) for the Orochi Harness |

## lsp

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-lsp` | no | Abstract LSP capability seam (ctx.lsp) for the Orochi Harness — language-server provider registry keyed by branded id and extension mapping, order-independent per-query selection, normalized definition/references/implementation/hover requests and results, and the LspError taxonomy |
| `@orochi-network/oh-lsp-stdio` | yes | Generic stdio language-server provider for the Orochi Harness LSP capability seam (ctx.lsp) — spawns configured servers, translates JSON-RPC, and serves transient-open goToDefinition/findReferences/goToImplementation/hover queries in the host filesystem namespace |
| `@orochi-network/oh-tool-lsp` | yes | Model-facing lsp tool over the Orochi Harness LSP capability seam (ctx.lsp) — one read-only tool with goToDefinition/findReferences/goToImplementation/hover operations, one-based UTF-16 cursor coordinates, bounded location rendering, and hover normalization |

## mcp

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-mcp-client` | yes | MCP client bridge: connects to MCP servers and registers their tools on ctx.tools |
| `@orochi-network/oh-mcp-resources` | no | Scoped MCP resource discovery and reading through shared model tools |

## plan

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-plan-mode` | yes | Logged per-agent plan mode with deployment guidance, a direct slash command, and a user-reviewed exit |

## preset

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-agent-preset` | yes | Declare an Agent capability composition in Cordis YAML |
| `@orochi-network/oh-agent-preset-registry` | yes | Declarative Agent preset registry and profile-backed editing |
| `@orochi-network/oh-persona` | yes | Composition-authored deployment persona section for the Orochi Harness |

## ptc-runtime

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-ptc-runtime-node` | yes | Sandboxed Node process implementation of the Orochi Harness PTC execution capability |

## runtime-diagnostics

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-invariants` | yes | Registry service for package-owned Orochi Harness runtime invariants |

## sandbox

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-sandbox-local` | yes | Local process-sandbox backends for the Orochi Harness sandbox seam: bwrap, the npm-distributed landlock-run launcher, macOS Seatbelt, or the Windows ACL restricted-token runner — functionally probed, fail-closed |
| `@orochi-network/oh-sandbox-policy` | yes | Per-call sandbox policy resolver and current model context: deployment fallbacks plus each session's mode and workspace root, shared by every enforcing capability family |

## schedule

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-schedule` | yes | Host-wide durable reminders with shared management and original-Session delivery |

## sdk

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-sdk-jsonrpc-server` | yes | Stdio JSON-RPC server plugin for out-of-process Orochi Harness SDK clients |

## session

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-session-checkpoint-policy` | no | Semantic session durability checkpoints before model requests and tool side effects |
| `@orochi-network/oh-session-persistence-jsonl` | yes | JSONL durable session persistence backend for the Orochi Harness |
| `@orochi-network/oh-session-projection` | no | Session-projection seam: the merge-extensible projection type table, the provider contract, and the ctx.sessionProjections registry serving whole current values of log-derived per-session state |
| `@orochi-network/oh-session-projection-cache` | yes | Persisted projection cache (ctx.sessionProjectionCache): durable per-session checkpoint records on the session_projcache storage domain (per-record layout), throttled write-behind, and the cached listing read |
| `@orochi-network/oh-session-stats` | no | Whole-log conversation counts and wall times projection (sessionStats) for the Orochi Harness |
| `@orochi-network/oh-session-title` | yes | Log-backed session title service and provider registry for the Orochi Harness |
| `@orochi-network/oh-session-title-all-prompts-llm` | yes | All-user-messages LLM provider plugin for Orochi Harness session titles |
| `@orochi-network/oh-session-title-first-prompt-llm` | yes | First-message LLM provider plugin for Orochi Harness session titles |
| `@orochi-network/oh-session-turn-outline` | no | Whole-log turn outline projection (turnOutline) for the Orochi Harness |

## session-query

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-session-log-export` | yes | Web Session-log export command and shared download dialog |
| `@orochi-network/oh-session-query-sqlite` | yes | Concrete ctx.sessionQuery backend with SQLite FTS5 search |
| `@orochi-network/oh-tool-session-query` | yes | Workspace-authorized model-facing session history search, trace, and event read tools |

## settings

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-settings` | no | Abstract user-settings seam (ctx.settings) for the Orochi Harness |

## shell

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-bash-local` | yes | Local-subprocess implementation of the Orochi Harness bash executor seam |
| `@orochi-network/oh-bash-sandbox` | yes | Sandbox-consuming implementation of the Orochi Harness bash executor seam (confines every command via ctx.sandbox, reports denial/enforcement result facts) |
| `@orochi-network/oh-pwsh-local` | yes | Local PowerShell implementation of the Orochi Harness bash executor seam |
| `@orochi-network/oh-pwsh-sandbox` | yes | Sandbox-consuming implementation of the Orochi Harness PowerShell executor seam (confines every command via ctx.sandbox, reports denial/enforcement result facts) |
| `@orochi-network/oh-shell-env` | yes | Tool-independent managed OH_* shell environment registry |
| `@orochi-network/oh-tool-bash` | yes | Model-facing bash tool with optional generic background-job and sandbox-escalation support |
| `@orochi-network/oh-tool-bash-persistent` | yes | Model-facing owner-scoped persistent Bash tool backed by the Harness PTY service |
| `@orochi-network/oh-tool-pwsh` | yes | Model-facing pwsh tool over the bash executor seam |
| `@orochi-network/oh-tool-pwsh-persistent` | yes | Model-facing owner-scoped persistent PowerShell tool backed by the Harness PTY service |

## skill

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-skill` | yes | Agent skill provider registry for the Orochi Harness |
| `@orochi-network/oh-skill-badge` | no | Bundled oh badge skill provider for Orochi Harness |
| `@orochi-network/oh-skill-filesystem` | yes | Local filesystem skill provider for the Orochi Harness |
| `@orochi-network/oh-skill-office` | yes | Bundled Word, PowerPoint, and Excel workflows and structural checks |
| `@orochi-network/oh-tool-skill` | yes | Model-facing skill loading tool for the Orochi Harness |
| `@orochi-network/oh-tool-workspace-dependencies` | yes | The load_workspace_dependencies tool: absolute paths into a bundled Python, Node.js, and pnpm payload |

## spill

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-spill-local` | yes | Local-filesystem implementation of the Orochi Harness spill storage seam (private session-scoped files) |
| `@orochi-network/oh-spill-policy` | yes | Token-budgeted tool-result retention with recoverable text and image paths |

## ssh

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-fs-ssh` | no | Filesystem provider over the shared POSIX SSH helper |
| `@orochi-network/oh-sandbox-ssh` | no | Remote POSIX sandbox argv provider over the shared SSH helper |
| `@orochi-network/oh-ssh` | yes | Shared OpenSSH connection and versioned POSIX remote helper |
| `@orochi-network/oh-subprocess-ssh` | no | Subprocess and terminal provider over the shared POSIX SSH helper |

## storage

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-storage` | no | Storage hub (ctx.storage): named backend registry plus mounted data-form facilities for the Orochi Harness |
| `@orochi-network/oh-storage-domain` | yes | Domain data form (ctx.storage.domain): schema-validated, event-emitting KV domains over storage backends for the Orochi Harness |
| `@orochi-network/oh-storage-json` | yes | JSON file KV storage backend for the Orochi Harness storage hub |
| `@orochi-network/oh-storage-sqlite` | yes | SQLite storage backend (kv facet) for the Orochi Harness storage hub |

## subagent

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-subagent` | yes | Abstract subagent seam (ctx.subagents): named-provider registry for delegating to child agents |
| `@orochi-network/oh-subagent-acp` | yes | Out-of-process ACP subagent backend: drives a child agent in a spawned subprocess over the Agent Client Protocol |
| `@orochi-network/oh-subagent-claude-code` | yes | One-shot Claude Code subagent provider over the official Agent SDK |
| `@orochi-network/oh-subagent-codex` | yes | One-shot Codex subagent provider over the official app-server protocol |
| `@orochi-network/oh-subagent-fork-in-process` | yes | In-process fork subagent backend: runs a child agent seeded with a prefix of the parent's log |
| `@orochi-network/oh-subagent-oh-sdk` | yes | Out-of-process SDK subagent backend: drives a child Orochi Harness runtime subprocess over stdio JSON-RPC through the TypeScript SDK client |
| `@orochi-network/oh-subagent-spawn-in-process` | yes | In-process spawn subagent backend: runs a fresh child agent on ctx.agents |
| `@orochi-network/oh-tool-subagent` | yes | Model-facing subagent delegation tool over the ctx.subagents seam |
| `@orochi-network/oh-tool-subagent-control` | no | Globally named send_message, interrupt_agent, and list_agents tools over ctx.subagents continuations |

## subprocess

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-subprocess-local` | no | Local-subprocess implementation of the Orochi Harness subprocess seam |

## terminal

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-terminal` | no | Persistent PTY session seam for the Orochi Harness — owner-scoped ids, backend registry, interactive sends, reads, signals, and awaited cleanup |
| `@orochi-network/oh-terminal-bash` | yes | Persistent shell PTY backend over the Orochi Harness subprocess terminal primitive |
| `@orochi-network/oh-tool-terminal` | yes | Six model-facing persistent PTY tools with owner isolation and generic background-job integration |

## test-support

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-llm-replay` | yes | Replay LLM plugin: short-circuits llm/stream with model chunks reconstructed from a recorded session JSONL (keyless snapshot tests) |

## todo

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-tool-todo` | yes | Model-facing todo_write tool over the Orochi Harness event-sourced session log |

## typert

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-typert-loader` | yes | Loader integration for generated Typert package contributions |

## web

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-tool-web` | yes | Model-facing web tools (web_search, web_fetch) over the Orochi Harness web capability seam (ctx.web) |
| `@orochi-network/oh-web` | yes | Abstract web access capability seam (ctx.web) for the Orochi Harness — search/fetch provider registry, registration-order-independent selection, request/result vocabulary, and the WebError taxonomy |
| `@orochi-network/oh-web-fetch-http` | yes | Anonymous public HTTP(S) fetch provider for the Orochi Harness web capability seam (ctx.web) |
| `@orochi-network/oh-web-search-exa` | yes | Exa-backed search provider for the Orochi Harness web capability seam (ctx.web) |
| `@orochi-network/oh-web-search-orochi` | yes | Orochi-backed search provider (native web_search via the Anthropic-compatible API) for the Orochi Harness web capability seam (ctx.web) |
| `@orochi-network/oh-web-search-perplexity` | yes | Perplexity-backed search provider for the Orochi Harness web capability seam (ctx.web) |

## webhook

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-webhook` | no | Fire-and-forget webhook rule runtime that creates Workspace-backed Orochi Harness Sessions |
| `@orochi-network/oh-webhook-github` | yes | Signed GitHub HTTP webhook adapter for the Orochi Harness webhook runtime |

## workflow

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-tool-ralph` | yes | Model-facing fresh-agent Ralph loop over the workflow and subagent seams |
| `@orochi-network/oh-tool-workflow` | yes | Model-facing workflow tool: run a JavaScript orchestration script over ctx.workflowEngine |
| `@orochi-network/oh-workflow-ptc` | yes | Workflow orchestration in the shared sandboxed Node PTC runtime |

## workspace

| Package | Config | Description |
|---|---|---|
| `@orochi-network/oh-workspace` | no | Workspace entity registry (ctx.workspaceRegistry): durable workspace records with validated session attachment over the domain data form for the Orochi Harness |
