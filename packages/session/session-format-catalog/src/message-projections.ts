/** Pure first-party message interpreters for detached current-format replay, including browser readers. */

import { imageOffloadProjection } from '@orochi-network/oh-compaction-image-offload/projection'
import type { SessionMessageProjection } from '@orochi-network/oh-session/surface'

/** Installed interpretation definitions; recovery listeners are mounted separately by their owning plugins. */
export const currentSessionMessageProjections: readonly SessionMessageProjection[] = [imageOffloadProjection]
