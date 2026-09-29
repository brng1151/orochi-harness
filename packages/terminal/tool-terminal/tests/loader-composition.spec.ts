import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@orochi-network/cordis'
import Loader from '@orochi-network/cordis-plugin-loader'
import Include from '@orochi-network/cordis-plugin-include'
import { ToolCallId } from '@orochi-network/oh-llm'
import { Session, SessionId } from '@orochi-network/oh-session'
import AgentRegistry from '@orochi-network/oh-agent'
import type { Agent } from '@orochi-network/oh-agent'
import SystemPrompt from '@orochi-network/oh-system-prompt'
import ToolRuntime from '@orochi-network/oh-tools'
import TerminalSessionService from '@orochi-network/oh-terminal'
import SandboxProvider from '@orochi-network/oh-sandbox'
import type { ConfinedArgv, SandboxPolicy } from '@orochi-network/oh-sandbox'
import SandboxPolicyService from '@orochi-network/oh-sandbox-policy'
import SessionProjectionRegistry from '@orochi-network/oh-session-projection'
import LocalSubprocessRuntime from '@orochi-network/oh-subprocess-local'
import * as TerminalLocal from '@orochi-network/oh-terminal-bash'
import * as ToolPty from '@orochi-network/oh-tool-terminal'
import { unsupportedInbox } from '@orochi-network/oh-agent-loop-testkit'

let root: string | undefined
let context: Context | undefined

afterEach(async () => {
  await context?.fiber.dispose()
  context = undefined
  if (root !== undefined) await rm(root, { recursive: true, force: true })
  root = undefined
})

class PassthroughSandbox extends SandboxProvider {
  async confine(argv: readonly string[], _policy: SandboxPolicy): Promise<ConfinedArgv> {
    return { argv: [...argv], enforcement: 'full', denialSignatures: [], runnerFailureRules: [] }
  }
}

async function agent(ctx: Context): Promise<Agent> {
  const scope = ctx.plugin(() => {})
  const id = SessionId('pty-loader-agent')
  const session = Session.create(id)
  const value: Agent = {
    id, options: {}, session, inbox: unsupportedInbox(),
    status: 'idle',
    ctx: scope.ctx,
    send: () => {},
    followup: () => {}, steer: () => {}, inject: () => {}, cancel() {},
    runMaintenance: job => job(new AbortController().signal),
    whenIdle: () => Promise.resolve(),
  }
  await ctx.agents.register(value)
  return value
}

function resultText(result: { content: { type: string; text?: string }[] }): string {
  return result.content.filter(block => block.type === 'text').map(block => block.text).join('')
}

const suite = process.platform === 'linux' || process.platform === 'darwin' ? describe : describe.skip

suite('terminal real Loader composition through cordis.yml', () => {
  it('boots cordis.yml and preserves shell state across real tool calls', async () => {
    root = await mkdtemp(join(tmpdir(), 'oh-pty-loader-'))
    const configPath = join(root, 'cordis.yml')
    await writeFile(configPath, [
      "- name: '@orochi-network/oh-agent'",
      "- name: '@orochi-network/oh-system-prompt'",
      "- name: '@orochi-network/oh-tools'",
      "- name: '@orochi-network/oh-terminal'",
      "- name: '@orochi-network/oh-test-sandbox'",
      "- name: '@orochi-network/oh-session-projection'",
      "- name: '@orochi-network/oh-sandbox-policy'",
      '  config:',
      '    mode: danger-full-access',
      `    workspaceRoot: ${JSON.stringify(root)}`,
      "- name: '@orochi-network/oh-subprocess-local'",
      "- name: '@orochi-network/oh-terminal-bash'",
      '  config:',
      '    pollIntervalMs: 10',
      '    exactProbeAfterMs: 20',
      '    idleSilenceMs: 250',
      '    handoffGraceMs: 250',
      '    timeoutMs: 2000',
      '    disposeGraceMs: 500',
      "- name: '@orochi-network/oh-tool-terminal'",
      '',
    ].join('\n'))

    context = new Context()
    context.baseUrl = pathToFileURL(root).href + '/'
    await context.plugin(Loader)
    context.loader.builtins.include = Include
    const modules = new Map<string, unknown>([
      ['@orochi-network/oh-agent', AgentRegistry],
      ['@orochi-network/oh-system-prompt', SystemPrompt],
      ['@orochi-network/oh-tools', ToolRuntime],
      ['@orochi-network/oh-terminal', TerminalSessionService],
      ['@orochi-network/oh-test-sandbox', PassthroughSandbox],
      ['@orochi-network/oh-session-projection', SessionProjectionRegistry],
      ['@orochi-network/oh-sandbox-policy', SandboxPolicyService],
      ['@orochi-network/oh-subprocess-local', LocalSubprocessRuntime],
      ['@orochi-network/oh-terminal-bash', TerminalLocal],
      ['@orochi-network/oh-tool-terminal', ToolPty],
    ])
    context.loader.internal = {
      version: 'v2',
      async import(specifier: string) {
        if (!modules.has(specifier)) throw new Error(`unexpected Loader import: ${specifier}`)
        return modules.get(specifier)
      },
    } as unknown as NonNullable<typeof context.loader.internal>
    await context.loader.create({ name: 'cordis:include', config: { path: pathToFileURL(configPath).href } })
    await context.loader.await()

    const owner = await agent(context)
    const signal = new AbortController().signal
    const spawn = await context.tools.execute({
      signal, callId: ToolCallId('spawn'), name: 'terminal_open', arguments: { type: 'shell', name: 'main', cwd: root }, agent: owner,
    })
    expect(resultText(spawn)).toContain('started terminal session pty-1 (main)')

    await context.tools.execute({
      signal, callId: ToolCallId('state'), name: 'terminal_send', arguments: { sessionId: 'pty-1', text: 'export KEEP=loader; cd /' }, agent: owner,
    })
    const read = await context.tools.execute({
      signal, callId: ToolCallId('read'), name: 'terminal_send', arguments: { sessionId: 'pty-1', text: 'printf "cwd=%s keep=%s\\n" "$PWD" "$KEEP"' }, agent: owner,
    })
    expect(resultText(read)).toContain('cwd=/ keep=loader')
    expect(context.terminals.list(owner)).toHaveLength(1)
  }, 15_000)
})
