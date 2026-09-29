/** Scalar value admitted at the durable Session JSON boundary. */
export type SessionFormatJsonPrimitive = null | boolean | number | string

/** Lossless JSON value admitted at the durable Session boundary. */
export type SessionFormatJsonValue =
  | SessionFormatJsonPrimitive
  | readonly SessionFormatJsonValue[]
  | SessionFormatJsonObject

/** Lossless JSON object admitted at the durable Session boundary. */
export interface SessionFormatJsonObject {
  readonly [key: string]: SessionFormatJsonValue
}

/** Logical Session metadata shared by supported historical and current formats. */
export interface SessionFormatHeader extends SessionFormatJsonObject {
  readonly version: number
  readonly id: string
  readonly createdAt: number
  readonly cwd?: string
  readonly parentSession?: string
  readonly isSeeded: boolean
  readonly origin?: 'subagent'
  readonly delegationDepth: number
  readonly agentPreset?: string
}

/** One decoded logical Session event. */
export interface SessionFormatEvent extends SessionFormatJsonObject {
  readonly type: string
  readonly seq: number
  readonly time: number
  readonly data: SessionFormatJsonValue
}

/** One detached complete logical Session artifact. */
export interface SessionFormatArtifact {
  readonly header: SessionFormatHeader
  /** Exact inherited prefix length, available only after a body read. */
  readonly inheritedEventCount: number
  readonly events: readonly SessionFormatEvent[]
}





/** Physical-row failure policy selected once for one restore. */
export type SessionFormatRecovery = 'strict' | 'recoverable'

/** Pure physical JSON codec frozen with one released Session format. */
export interface SessionFormatCodec {
  readonly version: number
  /** Decode one physical header into body-independent logical metadata. */
  decodeHeader(value: unknown): SessionFormatHeader
  /** Create one row-at-a-time decoder with an explicit failure policy. */
  createDecoder(headerValue: unknown, recovery: SessionFormatRecovery): SessionFormatArtifactDecoder
}

/** Stateful physical-row decoder used by streaming persistence restores. */
export interface SessionFormatArtifactDecoder {
  readonly header: SessionFormatHeader
  /** Inherited cut known before body decoding; current formats may derive it at EOF. */
  readonly headerInheritedEventCount?: number
  /** Decode one physical row and synchronously emit its events or compact run. */
  decodeRow(
    rowValue: unknown,
    context: SessionFormatMigrationContext,
  ): void
  /** Finish row validation and return the exact inherited cut. */
  finish(context: SessionFormatMigrationContext): number
}

/** Stateless physical record encoder for the installed current format. */
export interface SessionFormatCurrentEncoder {
  /** Encode the physical header record for one current artifact. */
  encodeHeader(header: SessionFormatHeader, inheritedEventCount: number): SessionFormatJsonObject
  /** Encode one current logical event as one physical record. */
  encodeEvent(event: SessionFormatEvent): SessionFormatJsonObject
}

/** Synchronous output channel a physical decoder emits settled events and compact runs to. */
export interface SessionFormatMigrationContext {
  /** Deliver one settled event to the restoring owner before returning. */
  emitEvent(event: SessionFormatEvent): void
  /** Deliver one compact event run to the restoring owner before returning. */
  emitRun(run: SessionFormatEventRun): void
}

/** A codec-owned compact run a restoring owner may consume without expanding. */
export interface SessionFormatEventRun {
  readonly runType: string
  readonly firstSeq: number
  readonly eventCount: number
  /** Expand the run into the settled events it encodes. */
  expand(): Iterable<SessionFormatEvent>
}


/** Header-only classification that never inspects event rows. */
export type SessionFormatHeaderReadResult =
  | {
    readonly status: 'current' | 'migration-required'
    readonly storedVersion: number
    readonly targetVersion: number
    /** Latest logical header. The exact inherited cut requires a body read. */
    readonly header: SessionFormatHeader
  }
  | {
    readonly status: 'unsupported'
    readonly storedVersion: number
    readonly targetVersion: number
    readonly reason: string
  }
  | {
    readonly status: 'malformed'
    readonly storedVersion?: number
    readonly targetVersion: number
    readonly reason: string
  }

/** Inputs for the installed single-generation physical codec and catalog. */
export interface SessionFormatCatalogOptions {
  /** The current writer version this build reads and writes. */
  readonly currentVersion: number
  /** The one installed physical codec. */
  readonly codec: SessionFormatCodec
  /** Restore and validate a complete current artifact. */
  readonly restoreCurrent: (artifact: SessionFormatArtifact) => SessionFormatArtifact
  /** Restore and validate a header without reading event bodies. */
  readonly restoreCurrentHeader: (header: SessionFormatHeader) => SessionFormatHeader
  /** Encode current records without materializing an artifact-sized row array. */
  readonly currentEncoder: SessionFormatCurrentEncoder
}

/** Policies applied by one physical-row restore. */
export interface SessionFormatRestoreOptions {
  readonly recovery: SessionFormatRecovery
  /**
   * `current` applies every installed current-format rule. `transformed` applies
   * the released current-format artifact restorer without the installed Session package's
   * vocabulary checks, which a reader that cannot mount every event type needs.
   */
  readonly validation: 'transformed' | 'current'
}

/** Installed single-generation physical dispatch and restore catalog. */
export interface SessionFormatCatalog {
  readonly currentVersion: number
  /** Classify and translate one header without reading event rows. */
  readHeader(headerValue: unknown): SessionFormatHeaderReadResult
  /** Create one single-pass physical-row restore into current logical events. */
  createRestore(headerValue: unknown, options: SessionFormatRestoreOptions): SessionFormatRestore
  /** Encode one current physical header record. */
  encodeCurrentHeader(header: SessionFormatHeader, inheritedEventCount: number): SessionFormatJsonObject
  /** Encode one current physical event record. */
  encodeCurrentEvent(event: SessionFormatEvent): SessionFormatJsonObject
}

/** One caller-owned physical-row restore whose final value is a current logical artifact. */
export interface SessionFormatRestore {
  /** Current logical header available before body decoding. */
  readonly header: SessionFormatHeader
  /** Decode one physical row in file order. */
  decodeRow(rowValue: unknown): void
  /** Finish the decoder and return the current artifact. */
  finish(): SessionFormatArtifact
}
