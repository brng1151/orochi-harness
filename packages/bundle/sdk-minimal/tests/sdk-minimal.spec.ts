/** The standalone SDK-minimal bundle's complete declared Cordis tree. */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as yaml from 'js-yaml'
import { describe, expect, it } from 'vitest'
import { entryListSchema } from '@orochi-network/cordis-plugin-include'

function packageName(specifier: string): string {
  return specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0]!
}

describe('oh-sdk-minimal bundle', () => {
  it('declares one standalone allowlisted tree with every row dependency', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      oh?: { bundle?: { patch?: string } }
    }
    expect(manifest.oh?.bundle?.patch).toBe('./cordis.patch.yml')
    const patches = yaml.load(
      readFileSync(resolve(root, manifest.oh!.bundle!.patch!), 'utf8'),
      { schema: entryListSchema },
    ) as Array<{ insert?: Array<{ id?: string; inject?: string[]; name?: string; config?: Record<string, unknown>; disabled?: unknown }> }>
    expect(patches).toHaveLength(1)
    const rows = patches[0]?.insert ?? []
    expect(rows.map(row => [row.id, row.name])).toEqual([
      ['sdk-app-startup', '@orochi-network/oh-sdk-app'],
      ['sdk-jsonrpc-server', '@orochi-network/oh-sdk-jsonrpc-server'],
      ['orochi-llm-api-extensions', '@orochi-network/oh-orochi-llm-api-extensions'],
      ['plugin-package-inventory-orochi', '@orochi-network/oh-plugin-package-inventory-orochi'],
      ['llm-orochi', '@orochi-network/oh-llm-orochi-api-key'],
      ['sandbox', '@orochi-network/oh-sandbox-local'],
      ['session-projection', '@orochi-network/oh-session-projection'],
      ['sandbox-policy', '@orochi-network/oh-sandbox-policy'],
      ['subprocess', '@orochi-network/oh-subprocess-local'],
      ['pty', '@orochi-network/oh-terminal'],
      ['terminal-bash', '@orochi-network/oh-terminal-bash'],
      ['terminal-pwsh', '@orochi-network/oh-terminal-bash'],
      ['timer', '@orochi-network/cordis-plugin-timer'],
      ['llm', '@orochi-network/oh-llm'],
      ['session', '@orochi-network/oh-session'],
      ['session-title', '@orochi-network/oh-session-title'],
      ['system-prompt', '@orochi-network/oh-system-prompt'],
      ['tools', '@orochi-network/oh-tools'],
      ['mcp-resources', '@orochi-network/oh-mcp-resources'],
      ['agent', '@orochi-network/oh-agent'],
      ['llm-retry', '@orochi-network/oh-llm-retry'],
      ['jobs', '@orochi-network/oh-jobs-local'],
      ['invariants', '@orochi-network/oh-invariants'],
      ['session-invariant', '@orochi-network/oh-session/invariant'],
      ['agent-invariant', '@orochi-network/oh-agent/invariant'],
      ['scope-invariant', '@orochi-network/oh-scope/invariant'],
      ['agent-loop-invariant', '@orochi-network/oh-agent-loop/invariant'],
      ['agent-loop', '@orochi-network/oh-agent-loop'],
      ['persistent-bash', '@orochi-network/oh-tool-bash-persistent'],
      ['persistent-pwsh', '@orochi-network/oh-tool-pwsh-persistent'],
      ['sessions', '@orochi-network/oh-session-persistence-jsonl'],
    ])
    expect(rows.find(row => row.id === 'sdk-app-startup')?.config).toEqual({ profile: 'sdk-minimal' })
    expect(rows.find(row => row.id === 'sdk-jsonrpc-server')).toMatchObject({
      inject: ['sdkAppStartup', 'loader'],
      config: { maxTokensAsSuccess: false },
    })
    expect(rows.find(row => row.id === 'llm-orochi')?.config).toEqual({
      apiKeyEnv: 'OROCHI_API_KEY',
      defaultContextWindow: { __jsExpr: 'Number(process.env.OH_CONTEXT_WINDOW ?? 1000000)' },
      streamIdleTimeoutMs: 172800000,
    })
    expect(rows.find(row => row.id === 'system-prompt')?.config).toEqual({
      includeHarnessIdentity: false,
      includeRuntimeContext: false,
      personaPrefix: { __jsExpr: "process.env.OH_SYSTEM_PROMPT ?? 'You are a helpful software engineer assistant.'" },
    })
    expect(rows.find(row => row.id === 'agent-loop')?.config).toEqual({ agents: [] })
    expect(rows.find(row => row.id === 'terminal-bash')).toMatchObject({
      disabled: { __jsExpr: "process.platform === 'win32'" },
    })
    expect(rows.find(row => row.id === 'terminal-pwsh')).toMatchObject({
      disabled: { __jsExpr: "process.platform !== 'win32'" },
      config: { shellDialect: 'pwsh', timeoutMs: 300000 },
    })
    expect(Object.keys(manifest.dependencies ?? {}).sort()).toEqual(
      [...new Set(rows.map(row => row.name).filter((name): name is string => name !== undefined).map(packageName))].sort(),
    )
  })
})
