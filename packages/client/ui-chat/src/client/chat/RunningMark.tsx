/** Brand mark Chat shows beside the elapsed-time shimmer while the Session runs. */
import { ORO_LOGO_PATH, ORO_LOGO_VIEWBOX } from '@orochi-network/oh-client-ui-primitives'
import css from './ChatView.module.css'

/**
 * Render the running brand mark. The stylesheet breathes it while the Session
 * runs and keeps it static under reduced-motion preferences.
 * @returns the mark svg wrapper (aria-hidden decorative brand art).
 */
export function RunningMark() {
  return (
    <span className={css.runningIcon} aria-hidden="true">
      <svg
        className={css.runningMark}
        width="100%"
        height="100%"
        viewBox={`0 0 ${ORO_LOGO_VIEWBOX.width} ${ORO_LOGO_VIEWBOX.height}`}
        fill="none"
      >
        <path d={ORO_LOGO_PATH} fill="currentColor" />
      </svg>
    </span>
  )
}
