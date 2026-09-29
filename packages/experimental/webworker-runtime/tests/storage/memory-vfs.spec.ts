/**
 * The identity, timestamp, link, mutation, and durability-sink guarantees
 * MemoryVfs owes its consumers, asserted directly rather than through the
 * `node:fs` bridge.
 *
 * `oh-fs-local` builds a version token from `dev:ino:size:mtimeNs:ctimeNs` and
 * refuses a write whose token moved since it read. Two properties carry that:
 * `ino` identifies the entry at a path, and `mtimeMs` moves on every write. The
 * timestamp cases freeze the clock, because these writes are in memory and two
 * revisions routinely land in the same millisecond — a real-clock test passes
 * whether or not the strict increment exists.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryVfs } from '../../src/storage/memory.ts'
import type { VfsBigIntStats, VfsMutation, VfsMutationSink, VfsStats } from '../../src/storage/types.ts'

const identity = (vfs: MemoryVfs, path: string): bigint =>
  (vfs.statSync(path, { bigint: true }) as VfsBigIntStats).ino

const linkCount = (vfs: MemoryVfs, path: string): bigint =>
  (vfs.statSync(path, { bigint: true }) as VfsBigIntStats).nlink

const modified = (vfs: MemoryVfs, path: string): number => (vfs.statSync(path) as VfsStats).mtimeMs

afterEach(() => { vi.restoreAllMocks() })

describe('entry identity', () => {
  it('distinguishes paths and holds each identity across repeated stats', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/oh/one.txt', 'one')
    vfs.seed('/oh/two.txt', 'two')
    const first = identity(vfs, '/oh/one.txt')
    expect(identity(vfs, '/oh/two.txt')).not.toBe(first)
    expect(identity(vfs, '/oh/one.txt')).toBe(first)
  })

  it('forgets the identities under a directory removed as a subtree', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/oh/skills/git/SKILL.md', '# git\n')
    const before = identity(vfs, '/oh/skills/git/SKILL.md')
    vfs.rmSync('/oh/skills', { recursive: true })
    vfs.seed('/oh/skills/git/SKILL.md', '# git rebuilt\n')
    expect(identity(vfs, '/oh/skills/git/SKILL.md')).not.toBe(before)
  })

  it('moves the source identity when a file replaces another path', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/oh/from.txt', 'moved')
    vfs.seed('/oh/to.txt', 'replaced')
    const [source, destination] = [identity(vfs, '/oh/from.txt'), identity(vfs, '/oh/to.txt')]
    vfs.renameSync('/oh/from.txt', '/oh/to.txt')
    const renamed = identity(vfs, '/oh/to.txt')
    expect(vfs.readFileSync('/oh/to.txt', 'utf8')).toBe('moved')
    expect([renamed === source, renamed === destination]).toEqual([true, false])
  })
})

describe('modification time', () => {
  it('hydrates explicit metadata without confusing timestamps with permission bits', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/oh/restored', 'value', { mode: 0o600, mtimeMs: 1_600_000_000_000 })
    vfs.seedDirectory('/oh/restored-directory', { mode: 0o700, mtimeMs: 1_600_000_000_001 })
    const stats = vfs.statSync('/oh/restored') as VfsStats
    const directory = vfs.statSync('/oh/restored-directory') as VfsStats
    expect([stats.mode & 0o777, stats.mtimeMs]).toEqual([0o600, 1_600_000_000_000])
    expect([directory.mode & 0o777, directory.mtimeMs]).toEqual([0o700, 1_600_000_000_001])
  })

  it('advances on every write even while the clock stands still', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    const vfs = new MemoryVfs()
    vfs.seed('/oh/log.jsonl', 'first\n')
    const seeded = modified(vfs, '/oh/log.jsonl')
    vfs.writeFileSync('/oh/log.jsonl', 'second\n')
    const written = modified(vfs, '/oh/log.jsonl')
    vfs.appendFileSync('/oh/log.jsonl', 'third\n')
    const appended = modified(vfs, '/oh/log.jsonl')
    vfs.truncateSync('/oh/log.jsonl', 6)
    const truncated = modified(vfs, '/oh/log.jsonl')
    expect([written > seeded, appended > written, truncated > appended]).toEqual([true, true, true])
    // One millisecond per revision: the increment is the minimum that separates
    // two tokens, not a coarser bump that would skew a real timestamp.
    expect(truncated - seeded).toBe(3)
  })

  it('takes the clock once the clock has passed the entry', () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    const vfs = new MemoryVfs()
    vfs.seed('/oh/log.jsonl', 'first\n')
    clock.mockReturnValue(1_700_000_005_000)
    vfs.writeFileSync('/oh/log.jsonl', 'second\n')
    expect(modified(vfs, '/oh/log.jsonl')).toBe(1_700_000_005_000)
  })

  it('extends truncation with zero bytes', async () => {
    const vfs = new MemoryVfs()
    vfs.seed('/oh/file', new Uint8Array([1, 2]))
    vfs.truncateSync('/oh/file', 5)
    expect([...vfs.readFileSync('/oh/file') as Uint8Array]).toEqual([1, 2, 0, 0, 0])
    const handle = vfs.open('/oh/file', 'r+')
    await handle.truncate(7)
    expect([...vfs.readFileSync('/oh/file') as Uint8Array]).toEqual([1, 2, 0, 0, 0, 0, 0])
  })

  it('advances a directory only when its immediate entry set changes', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    const vfs = new MemoryVfs()
    vfs.seedDirectory('/oh/workspace')
    const empty = modified(vfs, '/oh/workspace')
    vfs.writeFileSync('/oh/workspace/file.txt', 'one')
    const created = modified(vfs, '/oh/workspace')
    vfs.writeFileSync('/oh/workspace/file.txt', 'two')
    const rewritten = modified(vfs, '/oh/workspace')
    vfs.rmSync('/oh/workspace/file.txt')
    const removed = modified(vfs, '/oh/workspace')
    expect([created > empty, rewritten === created, removed > rewritten]).toEqual([true, true, true])
  })
})

describe('mutation publication', () => {
  it('publishes only committed runtime changes and keeps image seeding silent', () => {
    const vfs = new MemoryVfs()
    const mutations: VfsMutation[] = []
    vfs.subscribe((mutation) => { mutations.push(mutation) })
    vfs.seed('/oh/seeded.txt', 'seeded')
    expect(mutations).toEqual([])
    vfs.writeFileSync('/oh/seeded.txt', 'changed')
    vfs.mkdirSync('/oh/created')
    vfs.chmodSync('/oh/created', 0o700)
    vfs.renameSync('/oh/seeded.txt', '/oh/renamed.txt')
    vfs.rmSync('/oh/created', { recursive: true })
    expect(mutations.map(mutation => ({
      kind: mutation.kind,
      path: mutation.path,
      ...mutation.kind === 'write' ? { entryChanged: mutation.entryChanged } : {},
      ...mutation.kind === 'chmod' ? { mode: mutation.mode } : {},
    }))).toEqual([
      { kind: 'write', path: '/oh/seeded.txt', entryChanged: false },
      { kind: 'mkdir', path: '/oh/created' },
      { kind: 'chmod', path: '/oh/created', mode: 0o700 },
      { kind: 'remove', path: '/oh/seeded.txt' },
      { kind: 'write', path: '/oh/renamed.txt', entryChanged: true },
      { kind: 'remove', path: '/oh/created' },
    ])
    const renamed = mutations[4]
    expect(renamed?.kind === 'write' && new TextDecoder().decode(renamed.bytes)).toBe('changed')
    expect(() => { vfs.writeFileSync('/missing/file', 'no') }).toThrow(/ENOENT/)
    expect(mutations).toHaveLength(6)
  })

  it('contains a faulty observer and lets disposal stop later notifications', () => {
    const vfs = new MemoryVfs()
    vfs.seedDirectory('/oh')
    const reported = vi.spyOn(console, 'error').mockImplementation(() => {})
    const first = vfs.subscribe(() => { throw new Error('observer failed') })
    const seen: string[] = []
    const second = vfs.subscribe((mutation) => { seen.push(mutation.path) })
    vfs.writeFileSync('/oh/one', '1')
    first()
    second()
    vfs.writeFileSync('/oh/two', '2')
    expect(seen).toEqual(['/oh/one'])
    expect(reported).toHaveBeenCalledOnce()
  })

  it('feeds the same complete mutations to a durable sink and live subscribers', async () => {
    const recorded: VfsMutation[] = []
    let flushes = 0
    const sink: VfsMutationSink = {
      record: (mutation) => { recorded.push(mutation) },
      flush: async () => { flushes += 1 },
    }
    const vfs = new MemoryVfs({ sink })
    vfs.seedDirectory('/oh')
    const observed: VfsMutation[] = []
    vfs.subscribe((mutation) => { observed.push(mutation) })
    vfs.writeFileSync('/oh/log', 'a')
    vfs.appendFileSync('/oh/log', 'bc')
    await vfs.flush()
    expect(observed).toEqual(recorded)
    expect(observed[0]).toBe(recorded[0])
    expect(recorded[0]).toMatchObject({ kind: 'write', path: '/oh/log', mode: 0o644, entryChanged: true })
    expect(recorded[1]).toMatchObject({ kind: 'write', path: '/oh/log', mode: 0o644, entryChanged: false, appendedFrom: 1 })
    expect(recorded[1]?.kind === 'write' && new TextDecoder().decode(recorded[1].bytes)).toBe('abc')
    expect(flushes).toBe(1)
  })

  it('publishes descriptor writes at the file identity current path', () => {
    const mutations: VfsMutation[] = []
    const vfs = new MemoryVfs()
    vfs.seed('/oh/source', 'old')
    const descriptor = vfs.openFileSync('/oh/source', 'r+')
    vfs.subscribe((mutation) => { mutations.push(mutation) })
    vfs.renameSync('/oh/source', '/oh/destination')
    mutations.length = 0
    descriptor.write(0, new TextEncoder().encode('new'))
    expect(mutations.map(mutation => mutation.path)).toEqual(['/oh/destination'])
    expect(vfs.readFileSync('/oh/destination', 'utf8')).toBe('new')
    vfs.unlinkSync('/oh/destination')
    mutations.length = 0
    descriptor.write(0, new TextEncoder().encode('detached'))
    expect(mutations).toEqual([])
    expect(new TextDecoder().decode(descriptor.read(0, descriptor.stat().size))).toBe('detached')
  })

  it('reports the path identity through a BigInt file handle stat', async () => {
    const vfs = new MemoryVfs()
    vfs.seed('/oh/session.lock', '')
    const handle = vfs.open('/oh/session.lock', 'w')
    const held = await handle.stat({ bigint: true }) as VfsBigIntStats
    const current = vfs.statSync('/oh/session.lock', { bigint: true }) as VfsBigIntStats

    expect([held.dev, held.ino]).toEqual([current.dev, current.ino])
    await handle.chmod(0o600)
    expect((vfs.statSync('/oh/session.lock') as VfsStats).mode & 0o777).toBe(0o600)
    await handle.close()
  })

  it('decomposes a directory rename into replayable destination state', () => {
    const recorded: VfsMutation[] = []
    const vfs = new MemoryVfs({
      sink: { record: (mutation) => { recorded.push(mutation) }, flush: () => Promise.resolve() },
    })
    vfs.seedDirectory('/oh/staging/nested', { mode: 0o700 })
    vfs.seed('/oh/staging/nested/file', 'value', { mode: 0o600 })
    vfs.renameSync('/oh/staging', '/oh/published')

    expect(recorded.map(mutation => [mutation.kind, mutation.path])).toEqual([
      ['remove', '/oh/staging'],
      ['mkdir', '/oh/published'],
      ['mkdir', '/oh/published/nested'],
      ['write', '/oh/published/nested/file'],
    ])
    expect(recorded[3]).toMatchObject({ kind: 'write', mode: 0o600, entryChanged: true })
    expect(recorded[3]?.kind === 'write' && new TextDecoder().decode(recorded[3].bytes)).toBe('value')
  })
})

describe('directory rename', () => {
  it('rejects file, non-empty directory, and missing-parent destinations before mutation', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/oh/source/nested/file', 'source')
    vfs.seed('/oh/file', 'destination')
    vfs.seed('/oh/non-empty/child', 'destination')
    const mutations: VfsMutation[] = []
    vfs.subscribe((mutation) => { mutations.push(mutation) })

    expect(() => { vfs.renameSync('/oh/source', '/oh/file') })
      .toThrow(expect.objectContaining({ code: 'ENOTDIR' }))
    expect(() => { vfs.renameSync('/oh/source', '/oh/non-empty') })
      .toThrow(expect.objectContaining({ code: 'ENOTEMPTY' }))
    expect(() => { vfs.renameSync('/oh/source', '/missing/destination') })
      .toThrow(expect.objectContaining({ code: 'ENOENT' }))

    expect(vfs.readFileSync('/oh/source/nested/file', 'utf8')).toBe('source')
    expect(vfs.readFileSync('/oh/file', 'utf8')).toBe('destination')
    expect(vfs.readFileSync('/oh/non-empty/child', 'utf8')).toBe('destination')
    expect(mutations).toEqual([])
  })

  it('replaces an empty directory with the source subtree', () => {
    const vfs = new MemoryVfs()
    vfs.seedDirectory('/oh/source/nested', { mode: 0o700 })
    vfs.seed('/oh/source/nested/file', 'source')
    vfs.seedDirectory('/oh/destination', { mode: 0o711 })

    vfs.renameSync('/oh/source', '/oh/destination')

    expect(vfs.existsSync('/oh/source')).toBe(false)
    expect(vfs.readFileSync('/oh/destination/nested/file', 'utf8')).toBe('source')
    expect((vfs.statSync('/oh/destination') as VfsStats).mode & 0o777).toBe(0o755)
    expect((vfs.statSync('/oh/destination/nested') as VfsStats).mode & 0o777).toBe(0o700)
  })
})

describe('hard links', () => {
  it('shares identity, bytes, and mode until one name is removed', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/oh/session.jsonl', 'committed\n')
    vfs.linkSync('/oh/session.jsonl', '/oh/session-latest.jsonl')
    vfs.linkSync('/oh/session-latest.jsonl', '/oh/session-archive.jsonl')
    expect(identity(vfs, '/oh/session-latest.jsonl')).toBe(identity(vfs, '/oh/session.jsonl'))
    expect(linkCount(vfs, '/oh/session.jsonl')).toBe(3n)
    expect(vfs.readFileSync('/oh/session-latest.jsonl', 'utf8')).toBe('committed\n')
    const changedPaths: string[] = []
    vfs.subscribe((mutation) => { changedPaths.push(mutation.path) })
    vfs.appendFileSync('/oh/session.jsonl', 'appended\n')
    expect(changedPaths).toEqual([
      '/oh/session.jsonl',
      '/oh/session-latest.jsonl',
      '/oh/session-archive.jsonl',
    ])
    expect(vfs.readFileSync('/oh/session.jsonl', 'utf8')).toBe('committed\nappended\n')
    expect(vfs.readFileSync('/oh/session-latest.jsonl', 'utf8')).toBe('committed\nappended\n')
    vfs.chmodSync('/oh/session-latest.jsonl', 0o600)
    expect((vfs.statSync('/oh/session.jsonl') as VfsStats).mode & 0o777).toBe(0o600)
    vfs.unlinkSync('/oh/session-latest.jsonl')
    expect(linkCount(vfs, '/oh/session.jsonl')).toBe(2n)
    vfs.unlinkSync('/oh/session-archive.jsonl')
    expect(linkCount(vfs, '/oh/session.jsonl')).toBe(1n)
    expect(vfs.readFileSync('/oh/session.jsonl', 'utf8')).toBe('committed\nappended\n')
  })

  it('treats rename between names of the same node as a no-op', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/oh/source', 'value')
    vfs.linkSync('/oh/source', '/oh/alias')
    const mutations: VfsMutation[] = []
    vfs.subscribe((mutation) => { mutations.push(mutation) })

    vfs.renameSync('/oh/source', '/oh/alias')

    expect(vfs.readFileSync('/oh/source', 'utf8')).toBe('value')
    expect(vfs.readFileSync('/oh/alias', 'utf8')).toBe('value')
    expect(linkCount(vfs, '/oh/source')).toBe(2n)
    expect(mutations).toEqual([])
  })

  it('retargets linked names through file replacement and directory moves', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/oh/replacement', 'replacement')
    vfs.seed('/oh/target', 'old')
    vfs.linkSync('/oh/target', '/oh/target-alias')
    const replaced = vfs.openFileSync('/oh/target', 'r+')
    vfs.renameSync('/oh/replacement', '/oh/target')
    const mutations: VfsMutation[] = []
    vfs.subscribe((mutation) => { mutations.push(mutation) })

    replaced.write(0, new TextEncoder().encode('changed'))
    expect(mutations.map(mutation => mutation.path)).toEqual(['/oh/target-alias'])
    expect(vfs.readFileSync('/oh/target', 'utf8')).toBe('replacement')
    expect(vfs.readFileSync('/oh/target-alias', 'utf8')).toBe('changed')
    expect(linkCount(vfs, '/oh/target-alias')).toBe(1n)

    vfs.seed('/oh/tree/file', 'tree')
    vfs.linkSync('/oh/tree/file', '/oh/outside')
    const moved = vfs.openFileSync('/oh/tree/file', 'r+')
    vfs.renameSync('/oh/tree', '/oh/moved')
    mutations.length = 0
    moved.write(0, new TextEncoder().encode('moved'))
    expect(mutations.map(mutation => mutation.path)).toEqual(['/oh/outside', '/oh/moved/file'])
    expect(linkCount(vfs, '/oh/moved/file')).toBe(2n)

    vfs.rmSync('/oh/moved', { recursive: true })
    mutations.length = 0
    moved.write(0, new TextEncoder().encode('kept!'))
    expect(mutations.map(mutation => mutation.path)).toEqual(['/oh/outside'])
    expect(vfs.readFileSync('/oh/outside', 'utf8')).toBe('kept!')
    expect(linkCount(vfs, '/oh/outside')).toBe(1n)
  })

  it('rejects renaming a file over an existing directory', () => {
    const vfs = new MemoryVfs()
    vfs.seed('/oh/file', 'value')
    vfs.seedDirectory('/oh/directory')
    expect(() => { vfs.renameSync('/oh/file', '/oh/directory') }).toThrow(expect.objectContaining({ code: 'EISDIR' }))
    expect(vfs.readFileSync('/oh/file', 'utf8')).toBe('value')
    expect(vfs.statSync('/oh/directory').isDirectory()).toBe(true)
  })
})
