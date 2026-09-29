/** Render the installed format reference index from the validated in-tree schema. */

import { readFileSync } from 'node:fs'
import { join, posix } from 'node:path'
import { renderPersistencePair, type PersistenceArtifact } from './persistence-artifacts.ts'
import type { PersistenceFormats } from './persistence-formats.ts'

type Language = 'en' | 'zh'

function replaceRegion(source: string, name: string, content: string, path: string): string {
  const start = `<!-- persistence-format-${name}:start -->`
  const end = `<!-- persistence-format-${name}:end -->`
  const opening = source.indexOf(start)
  const closing = source.indexOf(end)
  if (opening < 0 || closing < opening || source.indexOf(start, opening + start.length) >= 0
    || source.indexOf(end, closing + end.length) >= 0) throw new Error(`${path}: expected one ${name} factual block`)
  return source.slice(0, opening + start.length) + '\n\n' + content.trim() + '\n\n' + source.slice(closing)
}

function formatIndex(formats: PersistenceFormats, language: Language): string {
  const [entry] = formats.entries
  /* v8 ignore next -- loadPersistenceFormats always returns the one installed reference. */
  if (entry === undefined) throw new Error('persistence-format-facts: no installed format entry')
  const document = language === 'zh' ? entry.document.replace(/\.md$/u, '.zh.md') : entry.document
  return [
    language === 'en'
      ? `This build reads and writes only Session format v${formats.currentVersion}; no earlier generation exists in this fork.`
      : `本构建只读写 Session 格式 v${formats.currentVersion}；此分支中不存在更早的格式代次。`,
    '',
    language === 'en' ? '| Format | Reference | Machine schema | Roots / types |' : '| 格式 | 参考文档 | 机器 schema | 根类型 / 类型 |',
    '|---|---|---|---|',
    `| ${entry.version} | [Current catalog](${posix.relative('docs/persistence-changes', document)}) | [JSON](${posix.relative('docs/persistence-changes', entry.schemaPath)}) | ${entry.inventory.roots.length} / ${entry.inventory.types.length} |`,
  ].join('\n')
}

/**
 * Refresh the bounded format index, preserving authored evidence.
 * @param root - repository with both document languages and a factual marker.
 * @param formats - the validated installed writer reference.
 * @returns the paired index and its consistency records without modifying files.
 */
export function persistenceFormatFactArtifacts(root: string, formats: PersistenceFormats): PersistenceArtifact[] {
  const artifacts: PersistenceArtifact[] = []
  const index = 'docs/persistence-changes/README.md'
  const renderIndex = (language: Language): string => {
    const path = language === 'en' ? index : index.replace(/\.md$/u, '.zh.md')
    return replaceRegion(readFileSync(join(root, path), 'utf8'), 'index', formatIndex(formats, language), path)
  }
  artifacts.push(...renderPersistencePair(root, index, renderIndex('en'), renderIndex('zh')))
  return artifacts
}
