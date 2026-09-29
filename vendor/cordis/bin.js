#!/usr/bin/env node

import { Context } from '@orochi-network/cordis'
import { pathToFileURL } from 'node:url'
import Loader from '@orochi-network/cordis-plugin-loader'

const ctx = new Context()
ctx.baseUrl = pathToFileURL(process.cwd()).href + '/'

await ctx.plugin(Loader)
await ctx.loader.create({
  name: '@orochi-network/cordis-plugin-include',
  config: {
    path: './cordis.yml',
  },
})
