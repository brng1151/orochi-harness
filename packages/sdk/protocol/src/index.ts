/**
 * Shared wire protocol for the Orochi Harness SDK runtime: the
 * newline-delimited JSON-RPC stdio transport plus the named request, result,
 * and notification types both wire ends speak. The runtime server plugin
 * (`@orochi-network/oh-sdk-jsonrpc-server`) serves this protocol; SDK clients
 * (`@orochi-network/oh-sdk-client`, the Python SDK) drive it.
 *
 * @module @orochi-network/oh-sdk-protocol
 */

export { JsonRpcLineTransport, JsonRpcResponseError } from './transport.ts'
export type { JsonRpcTransportPeer } from './transport.ts'
export type {
  HarnessSdkNotificationMap,
  HarnessSdkRequestMap,
  InitializeParams,
  InitializeResult,
  SdkEncodedImageBlock,
  SdkPromptContentBlock,
  SdkRunStatus,
  SessionEventNotification,
  SessionStatusNotification,
  SessionPromptParams,
  SessionPromptResult,
  SubagentFinishedNotification,
  SubagentStartedNotification,
} from './types.ts'
