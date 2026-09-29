/** Interpreted retired content must fail before recoverable native-tail suppression. */
import { Context } from '@orochi-network/cordis'
import { SESSION_FORMAT_VERSION, SessionId } from '@orochi-network/oh-session'
import { SessionPersistenceCorruptionError } from '@orochi-network/oh-session-persistence'
import JsonlSessionPersistence from '@orochi-network/oh-session-persistence-jsonl'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { describe, expect, it, onTestFinished } from 'vitest'
import { generationLogPath } from '../src/format.ts'
import { compressZstdFrame } from '../src/zstd.ts'

const id = SessionId('retired-content-admission')
const wrapper = { type: 'tool-result', toolCallId: 'retired-call', content: [{ type: 'text', text: 'result' }] }
const modes = (['none', 'zstd'] as const).flatMap(compression =>
  (['read', 'write'] as const).map(access => ({ compression, access })))

describe.each(modes)('retired content in JSONL ($compression, $access)', ({ compression, access }) => {
  async function stored(corruptPrefix: boolean) {
    const root = await mkdtemp(join(tmpdir(), 'oh-retired-content-'))
    const ctx = new Context()
    onTestFinished(async () => {
      try { await ctx.fiber.dispose() } finally { await rm(root, { recursive: true, force: true }) }
    })
    const event = {
      type: 'user/message', seq: 0, time: 1, surfaceOp: 'append',
      data: { id: 'user', role: 'user', source: { kind: 'user' }, content: [wrapper] },
    }
    const header = { type: 'session', version: SESSION_FORMAT_VERSION, id, createdAt: 1, delegationDepth: 0, isSeeded: false }
    const lines = [JSON.stringify(header) + '\n', ...(corruptPrefix ? ['{invalid json}\n'] : []), JSON.stringify(event) + '\n']
    const bytes = compression === 'none' ? Buffer.from(lines.join(''))
      : Buffer.concat(await Promise.all(lines.map(compressZstdFrame)))
    const path = generationLogPath(root, undefined, id, SESSION_FORMAT_VERSION, compression)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, bytes)
    await ctx.plugin(JsonlSessionPersistence, { root, compression })
    return { ctx, path, bytes }
  }

  it.each([false, true] as const)
  ('refuses a released tool-result wrapper with corruptPrefix=%s and preserves the only generation', async (corruptPrefix) => {
    const { ctx, path, bytes } = await stored(corruptPrefix)
    const opened = ctx.sessionPersistence.open(id, access).then(async (handle) => { await handle.close() })
    await expect(opened).rejects.toBeInstanceOf(SessionPersistenceCorruptionError)
    await expect(opened).rejects.toThrow(/released tool-result wrapper/)
    expect(await readFile(path)).toEqual(bytes)
    expect((await readdir(dirname(path))).filter(name => name !== 'session.lock')).toEqual([basename(path)])
  })
})
