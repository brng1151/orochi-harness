import { SessionFormatEventCollector } from './context.ts'
import { SessionFormatError, SessionFormatUnsupportedMigrationError } from './error.ts'
import {
  inspectSessionFormatVersion,
  snapshotSessionFormatHeader,
  sessionFormatVersion,
} from './json.ts'
import type {
  SessionFormatArtifact,
  SessionFormatArtifactDecoder,
  SessionFormatCatalog,
  SessionFormatCatalogOptions,
  SessionFormatEvent,
  SessionFormatEventRun,
  SessionFormatHeaderReadResult,
  SessionFormatMigrationContext,
  SessionFormatRestore,
  SessionFormatRestoreOptions,
} from './types.ts'

/**
 * Compile the installed single-generation Session format catalog.
 *
 * This build ships no migration chain, so it reads and writes exactly the
 * current format. A stored header declaring any other version is refused
 * before a body is read.
 *
 * @param options - current codec, current version, and current restorers.
 * @returns immutable physical dispatch and current-format restore operations.
 */
export function createSessionFormatCatalog(options: SessionFormatCatalogOptions): SessionFormatCatalog {
  const currentVersion = sessionFormatVersion(options.currentVersion, 'current Session format version')
  const codec = Object.freeze({ ...options.codec })
  if (sessionFormatVersion(codec.version, 'Session format codec version') !== currentVersion) {
    throw new SessionFormatError(
      `Session format codec v${codec.version} does not match current v${currentVersion}`,
    )
  }

  function readHeader(headerValue: unknown): SessionFormatHeaderReadResult {
    let storedVersion: number
    try {
      storedVersion = inspectSessionFormatVersion(headerValue)
    } catch (error: unknown) {
      return malformed(currentVersion, error)
    }
    if (storedVersion !== currentVersion) {
      return Object.freeze({
        status: 'unsupported',
        storedVersion,
        targetVersion: currentVersion,
        reason: `stored Session uses format v${storedVersion}; this build reads and writes only v${currentVersion}`,
      })
    }
    try {
      const decoded = snapshotSessionFormatHeader(codec.decodeHeader(headerValue), `format v${storedVersion} header`)
      const header = snapshotSessionFormatHeader(options.restoreCurrentHeader(decoded), 'current Session header restoration')
      if (header.version !== currentVersion) {
        throw new SessionFormatError(
          `current Session header restorer returned v${header.version}; expected v${currentVersion}`,
        )
      }
      return Object.freeze({ status: 'current', storedVersion, targetVersion: currentVersion, header })
    } catch (error: unknown) {
      return malformed(currentVersion, error, storedVersion)
    }
  }

  function createRestore(
    headerValue: unknown,
    restoreOptions: SessionFormatRestoreOptions,
  ): SessionFormatRestore {
    let storedVersion: number
    try {
      storedVersion = inspectSessionFormatVersion(headerValue)
    } catch (error: unknown) {
      throw new SessionFormatError('Session header must be a JSON object', { cause: error })
    }
    if (storedVersion !== currentVersion) {
      throw new SessionFormatUnsupportedMigrationError(
        `stored Session uses format v${storedVersion}; this build reads and writes only v${currentVersion}`,
      )
    }
    return new CurrentSessionFormatRestore(
      codec.createDecoder(headerValue, restoreOptions.recovery),
      restoreOptions.validation === 'current' ? options.restoreCurrent : identityArtifact,
      currentVersion,
    )
  }

  function encodeCurrentHeader(
    header: Parameters<SessionFormatCatalog['encodeCurrentHeader']>[0],
    inheritedEventCount: number,
  ) {
    if (inspectSessionFormatVersion(header) !== currentVersion) {
      throw new SessionFormatError(`encodeCurrent requires Session format v${currentVersion}`)
    }
    const encoded = options.currentEncoder.encodeHeader(header, inheritedEventCount)
    if (inspectSessionFormatVersion(encoded) !== currentVersion) {
      throw new SessionFormatError('current Session codec returned a non-current header')
    }
    return encoded
  }

  return Object.freeze({
    currentVersion,
    readHeader,
    createRestore,
    encodeCurrentHeader,
    encodeCurrentEvent: options.currentEncoder.encodeEvent.bind(options.currentEncoder),
  })
}

type SessionFormatArtifactRestorer = (artifact: SessionFormatArtifact) => SessionFormatArtifact

class CurrentSessionFormatRestore implements SessionFormatRestore, SessionFormatMigrationContext {
  readonly header: SessionFormatArtifact['header']
  private readonly collector = new SessionFormatEventCollector()

  constructor(
    private readonly decoder: SessionFormatArtifactDecoder,
    private readonly restoreArtifact: SessionFormatArtifactRestorer,
    private readonly currentVersion: number,
  ) {
    this.header = decoder.header
  }

  emitEvent(event: SessionFormatEvent): void {
    this.collector.emitEvent(event)
  }

  emitRun(run: SessionFormatEventRun): void {
    this.collector.emitRun(run)
  }

  decodeRow(rowValue: unknown): void {
    this.decoder.decodeRow(rowValue, this.collector)
  }

  finish(): SessionFormatArtifact {
    const inheritedEventCount = this.decoder.finish(this)
    if (this.decoder.headerInheritedEventCount !== undefined
      && this.decoder.headerInheritedEventCount !== inheritedEventCount) {
      throw new SessionFormatError('streaming decoder changed its predeclared inherited cut')
    }
    let restored: SessionFormatArtifact
    try {
      restored = this.restoreArtifact({
        header: this.header,
        inheritedEventCount,
        events: this.collector.values,
      })
    } catch (error: unknown) {
      if (error instanceof SessionFormatUnsupportedMigrationError) throw error
      const detail = error instanceof Error ? error.message : String(error)
      throw new SessionFormatUnsupportedMigrationError(
        `this build refuses the restored V${this.currentVersion} artifact: ${detail}`,
        { cause: error },
      )
    }
    return restoreCurrentVersion(restored, this.currentVersion)
  }
}

function restoreCurrentVersion(
  artifact: SessionFormatArtifact,
  currentVersion: number,
): SessionFormatArtifact {
  if (artifact.header.version !== currentVersion) {
    throw new SessionFormatError(
      `current Session restorer returned v${artifact.header.version}; expected v${currentVersion}`,
    )
  }
  return artifact
}

function identityArtifact(artifact: SessionFormatArtifact): SessionFormatArtifact {
  return artifact
}

function malformed(targetVersion: number, error: unknown, storedVersion?: number): SessionFormatHeaderReadResult {
  return Object.freeze({
    status: 'malformed',
    ...(storedVersion === undefined ? {} : { storedVersion }),
    targetVersion,
    reason: error instanceof Error ? error.message : String(error),
  })
}
