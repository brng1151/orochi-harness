import { BrandWordmark, OroLogo } from '@orochi-network/oh-client-ui-primitives'
import type { SidebarBrandMarkOwnerProps } from '@orochi-network/oh-client-ui-sidebar/client'

/**
 * Render the official mark with the presentation requested by its host surface.
 * @param props - Host-supplied mark presentation.
 * @returns the official Orochi mark.
 */
export function OfficialBrandMark({ size }: SidebarBrandMarkOwnerProps) {
  return <OroLogo size={size} />
}

/** Wordmark height in px: the tallest that fits beside the 28px mark at the 264px minimum sidebar width. */
const WORDMARK_SIZE = 25

/**
 * Render the official name artwork without its independently slotted mark.
 * @returns the official name wordmark.
 */
export function OfficialBrandName() {
  return <BrandWordmark includeMark={false} size={WORDMARK_SIZE} />
}
