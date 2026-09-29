/** Default Orochi model catalog. */
import { DEFAULT_CONTEXT_WINDOW } from './defaults.ts'
import type { OrochiCatalogModel } from './types.ts'

/**
 * Output cap both default models accept. The public endpoint reports 131,072
 * completion tokens for them, below the profile-wide `maxTokens` default, so
 * each entry carries its own cap and requests are not rejected for asking
 * beyond it.
 */
const MIMO_MAX_TOKENS = 131_072

/**
 * Advisory official model entries; deployments may replace the catalog.
 *
 * Neither entry declares `systemPromptUpdate` or `toolUpdate`: the public
 * endpoint does not document reading a later in-history `system` message as the
 * effective system prompt, nor activating a `defer_loading` tool from a
 * `tool_addition` block. Omission keeps the agent loop on full system-prompt and
 * tool-list re-declaration, which every Messages endpoint reads.
 */
export const DEFAULT_MODELS: OrochiCatalogModel[] = [
  {
    id: 'xiaomi/mimo-v2.6-flash',
    name: 'MiMo-V2.6-Flash',
    description: 'Fast, efficient, and economical; suited to focused, routine, or parallel tasks.',
    contextWindow: DEFAULT_CONTEXT_WINDOW,
    maxTokens: MIMO_MAX_TOKENS,
    inputModalities: ['text', 'image'],
  },
  {
    id: 'xiaomi/mimo-v2.6-pro',
    name: 'MiMo-V2.6-Pro',
    description: 'Stronger agentic coding, knowledge, and difficult reasoning; suited to complex or quality-critical tasks at higher cost.',
    contextWindow: DEFAULT_CONTEXT_WINDOW,
    maxTokens: MIMO_MAX_TOKENS,
    inputModalities: ['text', 'image'],
  },
]
