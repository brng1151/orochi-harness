/** Account sign-out policy over the latest logged request route. */
import type { Context } from '@orochi-network/cordis'
import { LlmError } from '@orochi-network/oh-llm'
import type { Agent } from '@orochi-network/oh-agent'
import type {} from './index.ts'

/**
 * Identify running work whose latest bound request used the account route.
 * @param agent - live Agent with its durable request context.
 * @returns whether account sign-out should interrupt this task.
 */
export function isRunningAccountTask(agent: Pick<Agent, 'status' | 'session'>): boolean {
  return agent.status === 'running' && agent.session.requestContext()?.provider === 'orochi-account'
}

/**
 * Cancel signed-out account tasks and publish sign-in guidance for rejected requests.
 * @param ctx - account provider lifetime; Agents may attach later.
 */
export function installAccountTaskCancellation(ctx: Context): void {
  ctx.inject(['agents'], (scope) => {
    scope.on('agent/error', ({ error }) => {
      if (error instanceof LlmError && error.code === 'ACCOUNT_SIGN_IN_REQUIRED') {
        scope.emit('orochi-account/model-sign-in-required')
      }
    })
    scope.on('orochi-account/signed-out', () => {
      for (const agent of scope.agents.list()) {
        if (isRunningAccountTask(agent)) {
          agent.cancel({ kind: 'hook', reason: 'orochi-account/signed-out' }, { keepInbox: true })
        }
      }
    })
  })
}
