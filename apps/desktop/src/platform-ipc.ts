/** Shared names for the desktop Platform bridge. */
/** Private desktop channels; the Platform renderer receives bootstrap and locale updates. */
export const PLATFORM_IPC = {
  bootstrap: 'oh-platform:bootstrap',
  localeChanged: 'oh-platform:locale-changed',
  open: 'oh-platform:open',
  bounds: 'oh-platform:bounds',
  close: 'oh-platform:close',
} as const

/** Resolved Platform language; Desktop resolves the system preference before sending it. */
export type PlatformLocale = 'en_US' | 'zh_CN'
