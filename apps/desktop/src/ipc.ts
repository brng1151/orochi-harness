/** Typed preload operations exposed only by the Electron shell. */

import type { DesktopKeyboardApi, DesktopShortcutsApi } from '@orochi-network/oh-client-shortcuts/protocol'
import type { IpcMainInvokeEvent } from 'electron'
import type { DesktopBrowserBridge } from '@orochi-network/oh-client-ui-sidebar-browser/types'

/** IPC channel names kept private to the desktop application bundle. */
export const DESKTOP_IPC = {
  shortcutsInput: 'oh-desktop:shortcuts-input',
  shortcutsCloseWindow: 'oh-desktop:shortcuts-close-window',
  shortcutsGet: 'oh-desktop:shortcuts-get',
  shortcutsEdit: 'oh-desktop:shortcuts-edit',
  shortcutsChanged: 'oh-desktop:shortcuts-changed',
  shortcutsRecording: 'oh-desktop:shortcuts-recording',
  boot: 'oh-desktop:boot',
  enterWorkspace: 'oh-desktop:enter-workspace',
  bootFailed: 'oh-desktop:boot-failed',
  browserAcquire: 'oh-desktop:browser-acquire',
  browserRelease: 'oh-desktop:browser-release',
  browserOpenRequested: 'oh-desktop:browser-open-requested',
  directoryPick: 'oh-desktop:directory-pick',
  localeBootstrap: 'oh-desktop:locale-bootstrap',
  localeChanged: 'oh-desktop:locale-changed',
  updatesStatus: 'oh-desktop:updates-status',
  updatesOpen: 'oh-desktop:updates-open',
  updatesPresentation: 'oh-desktop:updates-presentation',
  nativeThemeSet: 'oh-desktop:native-theme-set',
  windowFullscreen: 'oh-desktop:window-fullscreen',
  windowsAppearance: 'oh-desktop:windows-appearance',
  windowsMenu: 'oh-desktop:windows-menu',
} as const

/** Desktop release update state rendered by desktop-owned UI. */
export type DesktopUpdatePreparationFailureKind = 'stop-failed' | 'tasks-changed' | 'tasks-unavailable'

export interface DesktopUpdateState {
  readonly phase: 'idle' | 'checking' | 'available' | 'downloading' | 'verifying' | 'installing' | 'ready' | 'error'
  readonly version?: string
  readonly message?: string
  /** Main-owned diagnostics without subprocess output or credentials; hidden until expanded. */
  readonly technicalDetails?: string
  readonly percent?: number
  readonly failedOperation?: 'check' | 'download' | 'install'
  /** Main-owned preparation cause; UI wording is selected by the active locale. */
  readonly preparationFailure?: DesktopUpdatePreparationFailureKind
}

/** Classified failure copy selected by the Web locale without exposing raw updater diagnostics. */
export type DesktopUpdateFailureKind =
  | 'check'
  | 'check-network'
  | 'download'
  | 'download-network'
  | 'install'
  | 'install-network'
  | 'stop-failed'
  | 'tasks-changed'
  | 'tasks-unavailable'

/** Semantic status content; actions open main-process confirmation dialogs only. */
export interface DesktopUpdatePresentation {
  readonly phase: DesktopUpdateState['phase']
  readonly version?: string
  readonly percent?: number
  readonly failure?: DesktopUpdateFailureKind
}

/** Product documents cannot supply update versions, package URLs, or installation authorization. */
export interface OhDesktopProductApi {
  readonly protocolVersion: 1
  readonly browser: DesktopBrowserBridge
  readonly keyboard: DesktopKeyboardApi
  readonly shortcuts: DesktopShortcutsApi
  readonly updates: {
    status(): Promise<DesktopUpdatePresentation>
    open(): Promise<void>
    subscribe(listener: (state: DesktopUpdatePresentation) => void): () => void
  }
}

/** Scheme of Desktop-owned application documents. */
export const SCHEME = 'oh-app'

/**
 * Reject IPC outside the allowed Desktop document origins.
 * @param event - IPC caller whose frame URL supplies the origin.
 * @param hostnames - Desktop document hosts allowed for this operation.
 */
export function assertDesktopSender(event: IpcMainInvokeEvent, hostnames: readonly string[]): void {
  const senderFrame = event.senderFrame
  if (senderFrame === null) throw new Error('oh desktop: rejected IPC without a sender frame')
  const url = new URL(senderFrame.url)
  if (url.protocol !== `${SCHEME}:` || !hostnames.includes(url.hostname)) {
    throw new Error('oh desktop: rejected IPC from an unowned renderer')
  }
}
