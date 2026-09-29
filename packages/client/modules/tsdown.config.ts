import { clientBundle } from '../tsdown.client.ts'

export default clientBundle(
  '@orochi-network/oh-client-modules',
  ['lib/types/index.js', 'lib/types/invariant.js'],
)
