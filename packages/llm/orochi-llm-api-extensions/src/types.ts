/** Provider-specific JSON and contribution types for Orochi request extensions. */

/** Lossless JSON value accepted by the Orochi request body. */
export type OrochiLlmApiJson =
  | null
  | boolean
  | number
  | string
  | OrochiLlmApiJson[]
  | { [key: string]: OrochiLlmApiJson }

/**
 * Merge-extensible table of top-level Orochi request extension fields.
 * Contributor packages declaration-merge the field they own.
 */
export interface OrochiLlmApiExtensionMap {}

/** Exact serialized request facts visible to extension providers. */
export interface OrochiLlmApiExtensionRequest {
  /** Base Orochi request body before extension fields are merged. */
  readonly body: Readonly<Record<string, OrochiLlmApiJson>>
  /** Session identity carried by the model request, when present. */
  readonly sessionId?: string
  /** Auxiliary request classification, when present. */
  readonly purpose?: 'compaction' | 'session-title'
  /** Cancellation for request preparation; providers must stop promptly after abort. */
  readonly signal: AbortSignal
}

/** One prepared field value and its optional post-2xx commit. */
export interface PreparedOrochiLlmApiExtension<T extends OrochiLlmApiJson> {
  /** Detached value merged under the provider's registered field. */
  readonly value: T
  /** Commit state that depends on confirmed provider acceptance. */
  accept?(): void | Promise<void>
}

/** Provider registered under one key of {@link OrochiLlmApiExtensionMap}. */
export interface OrochiLlmApiExtensionProvider<T extends OrochiLlmApiJson> {
  /**
   * Prepare one field for an exact serialized request.
   * @param request - immutable base request facts.
   * @returns the prepared field, or `undefined` when this request has no value for it.
   */
  prepare(
    request: OrochiLlmApiExtensionRequest,
  ): PreparedOrochiLlmApiExtension<T> | undefined | Promise<PreparedOrochiLlmApiExtension<T> | undefined>
}

/** All fields prepared for one request plus their joint acceptance transaction. */
export interface PreparedOrochiLlmApiExtensions {
  /** Detached top-level fields to merge into the base request. */
  readonly fields: Readonly<Partial<OrochiLlmApiExtensionMap>>
  /**
   * Commit every captured provider after HTTP 2xx. Repeated calls join the same settlement.
   * @returns fulfillment after every commit succeeds.
   */
  accept(): Promise<void>
}
