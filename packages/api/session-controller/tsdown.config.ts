import { clientBundle } from '../../client/tsdown.client.ts'

export default clientBundle(
  '@orochi-network/oh-api-session-controller',
  ['lib/types/index.js'],
  { hostPhase: true },
)
