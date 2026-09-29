import { clientBundle } from '../../client/tsdown.client.ts'

export default clientBundle(
  '@orochi-network/oh-api-remotes',
  ['lib/types/index.js'],
  { hostPhase: true },
)
