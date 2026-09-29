// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ORO_LOGO_PATH } from '@orochi-network/oh-client-ui-primitives'
import { RunningMark } from '../src/client/chat/RunningMark.tsx'

afterEach(cleanup)

describe('RunningMark', () => {
  it('renders the decorative brand mark in currentColor on the mark canvas', () => {
    const view = render(<RunningMark />)
    expect(view.container.firstElementChild?.getAttribute('aria-hidden')).toBe('true')
    const svg = view.container.querySelector('svg')
    expect(svg?.getAttribute('viewBox')).toBe('0 0 32 32')
    const paths = view.container.querySelectorAll('path')
    expect(paths).toHaveLength(1)
    expect(paths[0]?.getAttribute('d')).toBe(ORO_LOGO_PATH)
    expect(view.container.innerHTML).toContain('currentColor')
  })
})
