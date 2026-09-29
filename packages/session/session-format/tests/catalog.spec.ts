import { describe, expect, it, vi } from 'vitest'
import {
  createSessionFormatCatalog,
  SessionFormatError,
  SessionFormatUnsupportedMigrationError,
  type SessionFormatArtifact,
  type SessionFormatCatalogOptions,
  type SessionFormatCodec,
  type SessionFormatCurrentEncoder,
  type SessionFormatEvent,
  type SessionFormatMigrationContext,
} from '../src/index.ts'

function codec(version: number, inheritedEventCount = 0): SessionFormatCodec & SessionFormatCurrentEncoder {
  return {
    version,
    decodeHeader(value: unknown) {
      return value as SessionFormatArtifact['header']
    },
    createDecoder(headerValue: unknown) {
      return {
        header: headerValue as SessionFormatArtifact['header'],
        headerInheritedEventCount: inheritedEventCount,
        decodeRow(rowValue: unknown, context: SessionFormatMigrationContext) {
          context.emitEvent(rowValue as SessionFormatEvent)
        },
        finish: () => inheritedEventCount,
      }
    },
    encodeHeader(header) {
      return header
    },
    encodeEvent(event) {
      return event
    },
  }
}

function options(overrides: Partial<SessionFormatCatalogOptions> = {}): SessionFormatCatalogOptions {
  const current = codec(7)
  return {
    currentVersion: 7,
    codec: current,
    currentEncoder: current,
    restoreCurrent: artifact => artifact,
    restoreCurrentHeader: header => header,
    ...overrides,
  }
}

const header = { version: 7, id: 'session', createdAt: 0, isSeeded: false, delegationDepth: 0 }

describe('createSessionFormatCatalog', () => {
  it('exposes the declared current version and identity encoding', () => {
    const catalog = createSessionFormatCatalog(options())
    expect(catalog.currentVersion).toBe(7)
    expect(catalog.encodeCurrentHeader(header, 0)).toBe(header)
    expect(catalog.encodeCurrentEvent({ type: 'turn/end', seq: 0, time: 0, data: {} })).toEqual({
      type: 'turn/end',
      seq: 0,
      time: 0,
      data: {},
    })
  })

  it('rejects a codec whose version disagrees with the declared writer', () => {
    expect(() => createSessionFormatCatalog(options({ codec: codec(6) })))
      .toThrow('Session format codec v6 does not match current v7')
  })

  it('rejects a negative declared writer version', () => {
    const current = codec(0)
    expect(() => createSessionFormatCatalog(options({ currentVersion: -1, codec: current, currentEncoder: current })))
      .toThrow('current Session format version must be a non-negative safe integer')
  })

  it('classifies the current header without reading a body', () => {
    const catalog = createSessionFormatCatalog(options())
    expect(catalog.readHeader(header)).toEqual({
      status: 'current',
      storedVersion: 7,
      targetVersion: 7,
      header,
    })
  })

  it('refuses an older stored generation instead of migrating it', () => {
    const catalog = createSessionFormatCatalog(options())
    expect(catalog.readHeader({ ...header, version: 6 })).toEqual({
      status: 'unsupported',
      storedVersion: 6,
      targetVersion: 7,
      reason: 'stored Session uses format v6; this build reads and writes only v7',
    })
  })

  it('refuses a newer stored generation', () => {
    const catalog = createSessionFormatCatalog(options())
    expect(catalog.readHeader({ ...header, version: 8 })).toMatchObject({
      status: 'unsupported',
      storedVersion: 8,
      reason: 'stored Session uses format v8; this build reads and writes only v7',
    })
  })

  it('classifies a malformed header before any dispatch', () => {
    const catalog = createSessionFormatCatalog(options())
    expect(catalog.readHeader('not a header')).toEqual({
      status: 'malformed',
      targetVersion: 7,
      reason: 'Session header must be a JSON object',
    })
    expect(catalog.readHeader({ id: 'session' })).toMatchObject({
      status: 'malformed',
      reason: 'Session format version must be a non-negative safe integer',
    })
  })

  it('reports a header the current restorer refuses as malformed', () => {
    const catalog = createSessionFormatCatalog(options({
      restoreCurrentHeader: () => { throw new SessionFormatError('refused header') },
    }))
    expect(catalog.readHeader(header)).toEqual({
      status: 'malformed',
      storedVersion: 7,
      targetVersion: 7,
      reason: 'refused header',
    })
  })

  it('rejects a current header restorer that returns another generation', () => {
    const catalog = createSessionFormatCatalog(options({ restoreCurrentHeader: value => ({ ...value, version: 6 }) }))
    expect(catalog.readHeader(header)).toMatchObject({
      status: 'malformed',
      reason: 'current Session header restorer returned v6; expected v7',
    })
  })

  it('restores a current artifact with every decoded row', () => {
    const catalog = createSessionFormatCatalog(options({ codec: codec(7, 2), currentEncoder: codec(7, 2) }))
    const restore = catalog.createRestore(header, { recovery: 'strict', validation: 'current' })
    expect(restore.header).toEqual(header)
    restore.decodeRow({ type: 'user/message', seq: 0, time: 0, data: {} })
    restore.decodeRow({ type: 'turn/end', seq: 1, time: 0, data: {} })
    expect(restore.finish()).toEqual({
      header,
      inheritedEventCount: 2,
      events: [
        { type: 'user/message', seq: 0, time: 0, data: {} },
        { type: 'turn/end', seq: 1, time: 0, data: {} },
      ],
    })
  })

  it('applies the installed restorer only under the current validation policy', () => {
    const installed = vi.fn((artifact: SessionFormatArtifact) => artifact)
    const catalog = createSessionFormatCatalog(options({ restoreCurrent: installed }))
    const rows = [{ type: 'turn/end', seq: 0, time: 0, data: {} }]
    const transformed = catalog.createRestore(header, { recovery: 'strict', validation: 'transformed' })
    for (const row of rows) transformed.decodeRow(row)
    transformed.finish()
    expect(installed).not.toHaveBeenCalled()
    const current = catalog.createRestore(header, { recovery: 'strict', validation: 'current' })
    for (const row of rows) current.decodeRow(row)
    current.finish()
    expect(installed).toHaveBeenCalledTimes(1)
  })

  it('rejects a decoder that moves its predeclared inherited cut', () => {
    const base = codec(7, 0)
    const catalog = createSessionFormatCatalog(options({
      codec: {
        ...base,
        createDecoder: () => ({
          header,
          headerInheritedEventCount: 4,
          decodeRow: () => {},
          finish: () => 5,
        }),
      },
    }))
    expect(() => catalog.createRestore(header, { recovery: 'strict', validation: 'current' }).finish())
      .toThrow('streaming decoder changed its predeclared inherited cut')
  })

  it('rejects a restorer that returns another generation', () => {
    const catalog = createSessionFormatCatalog(options({
      restoreCurrent: artifact => ({ ...artifact, header: { ...artifact.header, version: 6 } }),
    }))
    expect(() => catalog.createRestore(header, { recovery: 'strict', validation: 'current' }).finish())
      .toThrow('current Session restorer returned v6; expected v7')
  })

  it('reclassifies an installed-restorer failure as an unsupported artifact', () => {
    const catalog = createSessionFormatCatalog(options({
      restoreCurrent: () => { throw new Error('installed vocabulary rejected the artifact') },
    }))
    expect(() => catalog.createRestore(header, { recovery: 'strict', validation: 'current' }).finish())
      .toThrow('this build refuses the restored V7 artifact: installed vocabulary rejected the artifact')
  })

  it('refuses a restore for a generation this build does not read', () => {
    const catalog = createSessionFormatCatalog(options())
    expect(() => catalog.createRestore({ ...header, version: 6 }, { recovery: 'strict', validation: 'current' }))
      .toThrow('stored Session uses format v6; this build reads and writes only v7')
    expect(() => catalog.createRestore('not a header', { recovery: 'strict', validation: 'current' }))
      .toThrow(SessionFormatError)
  })

  it('rejects encoding a header that is not the current generation', () => {
    const catalog = createSessionFormatCatalog(options())
    expect(() => catalog.encodeCurrentHeader({ ...header, version: 6 }, 0))
      .toThrow('encodeCurrent requires Session format v7')
  })

  it('rejects a current encoder that emits a non-current header', () => {
    const base = codec(7)
    const catalog = createSessionFormatCatalog(options({
      currentEncoder: { ...base, encodeHeader: value => ({ ...value, version: 6 }) },
    }))
    expect(() => catalog.encodeCurrentHeader(header, 0)).toThrow('current Session codec returned a non-current header')
  })

  it('keeps a decoding failure inside the decoder error vocabulary', () => {
    const catalog = createSessionFormatCatalog(options({
      codec: {
        ...codec(7),
        createDecoder: () => ({
          header,
          decodeRow: () => { throw new Error('row is not JSON') },
          finish: () => 0,
        }),
      },
    }))
    const restore = catalog.createRestore(header, { recovery: 'strict', validation: 'current' })
    expect(() => { restore.decodeRow({}) }).toThrow('row is not JSON')
  })

  it('propagates the unsupported-migration refusal class unchanged', () => {
    const catalog = createSessionFormatCatalog(options({
      restoreCurrent: () => { throw new SessionFormatUnsupportedMigrationError('unknown event type') },
    }))
    expect(() => catalog.createRestore(header, { recovery: 'strict', validation: 'current' }).finish())
      .toThrow('unknown event type')
  })
})
