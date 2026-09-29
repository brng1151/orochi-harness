/** The brand font remains self-contained in the packaged Web application. */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('offline brand font', () => {
  it('ships local WOFF2 files with their redistribution license', () => {
    const css = readFileSync(new URL('../src/styles/brand-font.css', import.meta.url), 'utf8')
    const fontPath = /url\(\.\/([^)]*\.woff2)\)/.exec(css)?.[1]
    expect(fontPath).toBeDefined()
    const font = readFileSync(new URL(`../src/styles/${fontPath!}`, import.meta.url))
    expect(font.readUInt32BE(0)).toBe(0x774f4632)
    expect(css).toContain('font-weight: 400')
    expect(css).toContain('font-weight: 500')
    expect(css).toContain('font-weight: 600')
    expect(css).toContain('font-weight: 700')
    for (const file of ['raleway-regular.woff2', 'raleway-medium.woff2', 'raleway-semibold.woff2', 'raleway-bold.woff2']) {
      expect(css).toContain(`url(./${file})`)
      const face = readFileSync(new URL(`../src/styles/${file}`, import.meta.url))
      expect(face.readUInt32BE(0)).toBe(0x774f4632)
    }
    expect(css).toContain('font-style: normal')
    expect(css).not.toMatch(/url\(https?:/)
    const license = readFileSync(new URL('../src/styles/Raleway-OFL.txt', import.meta.url), 'utf8')
    expect(license).toContain('SIL OPEN FONT LICENSE Version 1.1')
    const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
      files: string[]
      exports: Record<string, unknown>
    }
    expect(manifest.files).toContain('lib/styles')
    expect(manifest.exports['./brand-font.css']).toBe('./lib/styles/brand-font.css')
  })
})
