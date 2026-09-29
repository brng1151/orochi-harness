/**
 * TypeScript client SDK for the Orochi Harness runtime: spawn the
 * same-version `oh --profile sdk` runtime as a subprocess and drive agent
 * turns over stdio JSON-RPC. `OrochiHarness` is the high-level run API;
 * `HarnessClient` is the lower-level protocol client. A pure library — it
 * registers nothing on a Cordis context; named profiles and ordered patch
 * files customize the runtime process it spawns.
 *
 * @module @orochi-network/oh-sdk-client
 */

export { OrochiHarness, HarnessSession } from './api.ts'
export type { RunOptions } from './api.ts'
export {
  HarnessClient,
  RequestTimeoutError,
  SdkProtocolError,
  TransportClosedError,
} from './client.ts'
export type { NotificationSubscription } from './client.ts'
export { JsonRpcResponseError } from '@orochi-network/oh-sdk-protocol'
export type {
  ContentBlock,
  SdkPromptContentBlock,
  OrochiHarnessOptions,
  HarnessClientOptions,
  HarnessNotification,
  NotificationFilter,
  RunResult,
} from './types.ts'
