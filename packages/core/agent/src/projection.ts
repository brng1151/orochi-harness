import type { TurnBoundaryProjection } from './types.ts'
import type {} from '@orochi-network/oh-session-projection'

declare module '@orochi-network/oh-session-projection/types' {
  interface SessionProjectionStateMap {
    /** The agent session's open/last turn and step boundary facts (whole value). */
    turnBoundary: TurnBoundaryProjection
  }
}

export {}
