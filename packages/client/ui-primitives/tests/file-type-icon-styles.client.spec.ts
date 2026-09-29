/** FileTypeIcon's default per-category palette as CSS text. */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { CodeFileType, FileType } from '@orochi-network/oh-client-ui-primitives'

const css = readFileSync(fileURLToPath(new URL('../src/FileTypeIcon.module.css', import.meta.url)), 'utf8')

type TraditionalFileType = Exclude<FileType, CodeFileType>

const TYPE_COLORS: Readonly<Record<TraditionalFileType, string>> = {
  code: 'var(--oh-static-orochi-500)',
  excel: 'var(--oh-static-green-500)',
  folder: 'var(--oh-static-amber-400)',
  html: 'var(--oh-static-orochi-500)',
  image: 'var(--oh-file-type-violet)',
  markdown: 'var(--oh-static-orochi-500)',
  other: 'var(--oh-static-neutral-bluish-300)',
  pdf: 'var(--oh-static-red-600)',
  ppt: 'var(--oh-static-amber-500)',
  video: 'var(--oh-file-type-violet)',
  word: 'var(--oh-static-orochi-450)',
}

describe('FileTypeIcon.module.css', () => {
  it.each(Object.entries(TYPE_COLORS) as [TraditionalFileType, string][])(
    '%s has its own default color',
    (type, color) => {
      const rule = css.match(new RegExp(`\\.${type}\\s*\\{([^}]*)\\}`))?.[1]
      expect(rule).toContain(`--oh-file-type-default-color: ${color}`)
    },
  )

  it('keeps one caller override and the supplied violet in named variables', () => {
    expect(css).toContain('color: var(--oh-file-type-icon-color, var(--oh-file-type-default-color))')
    expect(css).toContain('--oh-file-type-violet: rgb(139, 118, 246)')
  })
})
