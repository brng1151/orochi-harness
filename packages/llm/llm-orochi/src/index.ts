/** Orochi Messages transport, request configuration, and model capabilities. */
export { orochiConfigFields, Config, plainOptions, resolveAdapterOptions, PUBLIC_BASE_URL } from './config.ts'
export type { Options, ResolvedOrochiOptions } from './config.ts'
export {
  DEFAULT_CONTEXT_WINDOW,
  DEFAULT_FILE_EXPIRY_SECONDS,
  DEFAULT_FILE_QUOTA_CLEANUP_BATCH,
  DEFAULT_FILE_REFRESH_MARGIN_SECONDS,
  DEFAULT_FILES_API_TIMEOUT_MS,
  DEFAULT_IMAGE_OFFLOAD_BYTE_QUANTUM,
  DEFAULT_IMAGE_OFFLOAD_COUNT_QUANTUM,
  DEFAULT_INLINE_IMAGE_OFFLOAD_BYTE_QUANTUM,
  DEFAULT_MAX_INLINE_REQUEST_IMAGE_BYTES,
  DEFAULT_MAX_TOKENS,
  DEFAULT_STREAM_IDLE_TIMEOUT_MS,
} from './defaults.ts'
export { OrochiAdapter } from './adapter.ts'
export type { OrochiRequestAuth, OrochiAdapterOptions, OrochiCatalogModel, OrochiConnectionOptions } from './types.ts'
export {
  DEFAULT_LOW_DETAIL_IMAGE_PIXEL_BUDGET,
  DEFAULT_MAX_IMAGES_PER_REQUEST,
  DEFAULT_MAX_REQUEST_FILES_BYTES,
  DEFAULT_REQUEST_IMAGE_MAX_BYTES,
  REQUEST_IMAGE_MAX_DIMENSION,
  orochiImageRequestPricing,
  resolveRequestImageMaxBytes,
  resolveRequestImageTarget,
} from './request-pricing.ts'
export { orochiImageTokens, orochiRequestImageDimensions } from './image-tokens.ts'
export { OrochiFileStore, MAX_IMAGE_BYTES } from './file-store.ts'
export type { OrochiFileConnection, OrochiFilePolicy, OrochiFileReference } from './file-store.ts'
export { OrochiFilesClient, MAX_FILE_EXPIRY_SECONDS, MAX_FILE_UPLOAD_BYTES, MAX_STORED_FILE_BYTES, MAX_STORED_FILE_COUNT, MIN_FILE_EXPIRY_SECONDS } from './files-api.ts'
export type { OrochiFileObject, OrochiFilePage } from './files-api.ts'
export { OrochiFileId } from './file-id.ts'
export type { OrochiFileId as OrochiFileIdType } from './file-id.ts'
export { OrochiUploadIndex, orochiFileScope } from './upload-index.ts'
export type { OrochiUploadRecord } from './upload-index.ts'
export type { RequestDefaults } from './types.ts'

export { catalogModelInfo } from './model-info.ts'
export { registerOrochiProvider } from './host.ts'
