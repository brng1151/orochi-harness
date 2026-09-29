import { clientBundle } from '../tsdown.client.ts'

export default clientBundle(
  '@orochi-network/oh-client-ui-theme',
  ['lib/types/index.js'],
  {
    lib: {
      copy: [{
        from: 'src/styles/{brand-font.css,raleway-*.woff2,Raleway-OFL.txt}',
        to: 'lib/styles',
      }],
    },
  },
)
