import { clientBundle } from '../../client/tsdown.client.ts'

export default clientBundle(
  '@orochi-network/oh-api-job-controller',
  ['lib/types/index.js'],
  { hostPhase: true },
)
