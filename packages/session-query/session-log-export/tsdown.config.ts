import { clientBundle } from '../../client/tsdown.client.ts'

export default clientBundle(
  '@orochi-network/oh-session-log-export',
  ['lib/types/index.js'],
  { hostPhase: true },
)
