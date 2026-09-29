/** Dependency-free IPC names shared with the sandboxed mandatory-update preload. */
export const MANDATORY_IPC = {
  status: 'oh-desktop:mandatory-status', state: 'oh-desktop:mandatory-state', action: 'oh-desktop:mandatory-action',
} as const
