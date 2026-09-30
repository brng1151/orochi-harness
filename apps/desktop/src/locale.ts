/** Typed English and Chinese copy owned by the Electron shell. */

export const en = {
  application: 'Application',
  fileMenu: 'File',
  closePage: 'Close Page or Window',
  aboutMenu: 'About Orochi Harness',
  aboutProduct: 'Orochi Harness',
  aboutVersion: 'Version V{version}',
  hideApplication: 'Hide Orochi Harness',
  hideOtherApplications: 'Hide Others',
  showAllApplications: 'Show All',
  quitApplication: 'Quit Orochi Harness',
  openApplication: 'Open Orochi Harness',
  quit: 'Quit',
  cancel: 'Cancel',
  quitTitle: 'Quit Orochi Harness?',
  quitActiveTasks: 'Running tasks will be interrupted.',
  quitScheduledTasks: 'Scheduled tasks will not run while the app is closed.',
  quitActiveAndScheduledTasks: 'Running tasks will be interrupted, and scheduled tasks will not run while the app is closed.',
  backgroundNoticeBody: 'Running tasks will continue. You can reopen the window from the system tray.',
  backgroundNoticeConfirm: 'Confirm',
  edit: 'Edit',
  menuBar: 'Application menu',
  delete: 'Delete',
  undo: 'Undo',
  redo: 'Redo',
  cut: 'Cut',
  copy: 'Copy',
  paste: 'Paste',
  selectAll: 'Select All',
  startupFailed: 'Orochi Harness is unavailable',
  fatalSummary: 'The application could not start or stopped unexpectedly.',
  startupAddressInUse: 'Another OH instance (such as oh web or the desktop app) is running. They cannot start at the same time. Quit the other running OH instance, then restart.',
  diagnosticTruncated: '… Error details shortened.',
  reportWrittenTo: 'Diagnostic report: {path}',
  startupReinstallAdvice: 'If application files are missing or damaged, close the application and reinstall it. Your tasks are stored separately.',
  exitApplication: 'Exit',
  restartApplication: 'Restart',
  recoveryOperationFailed: 'The recovery operation failed',
  disableThirdPartyPlugins: 'Disable third-party plugins, back up profile patch, and restart',
  welcomeTitle: 'Orochi Harness',
  welcomeBrand: 'Orochi Harness',
  welcomeTaglineBefore: 'Welcome to ',
  welcomeTaglineBrand: 'Orochi Harness',
  welcomeTaglineAfter: '',
  welcomeDescription: 'Open Source Must Win',
  welcomeApiKey: 'Add API Key',
  welcomeKeyTitle: 'Add an API key to get started',
  welcomeKeyDescription: 'Configure an OpenRouter API key to start using Harness',
  welcomeKeyPlaceholder: 'Enter API key',
  welcomeKeySave: 'Save and continue',
  welcomeKeyLater: 'Set up later',
  welcomeKeyBack: 'Back',
  welcomeKeyBlank: 'Enter an API key.',
  welcomeKeyInvalid: 'Enter the API key itself, without quotes, spaces, or an environment-variable assignment.',
  welcomeKeyFailed: 'Could not save the API key. Please try again.',
  welcomeContinueFailed: 'Could not open the workspace. Please try again.',
  checkUpdatesMenu: 'Check for Updates…',
  reloadPageMenu: 'Reload Page',
  restartAppHostMenu: 'Restart App and Host',
  updateCheckFailedTitle: 'Update Check Failed',
  updateCheckFailed: 'Could not check for updates. Please try again later.',
  updateDownloadFailed: 'Could not download the update. Please try again.',
  updateInstallFailed: 'Could not install the update. Please try again later.',
  updateCheckNetworkFailed: 'Could not check for updates. Check your connection and try again.',
  updateDownloadNetworkFailed: 'Could not download the update. Check your connection and try again.',
  updateInstallNetworkFailed: 'Could not install the update. Check your connection and try again.',
  unknownError: 'Unknown error',
  updateCheckTitle: 'Check for Updates',
  updateCurrentDetail: 'Current version: {version}',
  updateCurrent: 'You’re up to date!',
  updateChecking: 'Checking for updates…',
  updateDownload: 'Download update',
  updateDownloadedTitle: 'Version {version} is ready to install',
  updateDownloadedDetail: 'The app will close during the update and reopen automatically when it is complete.',
  updateDownloadedDetailWindows: 'The app will close temporarily during the update and reopen automatically when it is complete.\n\nThe update may take some time. Please wait and do not launch the app again during installation.',
  updateClose: 'Close',
  updateAcknowledge: 'OK',
  updateLater: 'Update later',
  updateDownloading: 'Downloading {percent}%…',
  updateVerifying: 'Verifying update files…',
  updateInstalling: 'Preparing to restart…',
  updateRetry: 'Retry update',
  updateActiveTasks: 'Tasks are still in progress',
  updateActiveTasksDetail: 'Updating will stop the tasks in progress and restart the app. Continue?',
  updateStopTasks: 'Stop tasks and update',
  updateTasksChanged: 'New tasks have started. Confirm again to stop the tasks and update.',
  updateTasksUnavailable: 'Task status is unavailable. Try updating again when the workspace is ready.',
  updateStopFailed: 'Could not safely stop the tasks. The update has not been installed. Please try again later.',
  updateTechnicalDetails: 'View technical details',
  updateTitle: 'Orochi Harness Update',
  updateAvailable: 'New version available: {version}',
  updateDetail: 'Once the download is complete, you can install the update and restart the app.',
  installAndRestart: 'Install and Restart',
  later: 'Later',
  updateFailedTitle: 'Update Failed',
} as const

/** Every Desktop locale supplies the complete English key set. */
export type DesktopMessages = { readonly [Key in keyof typeof en]: string }

export const zh = {
  application: '应用',
  fileMenu: '文件',
  closePage: '关闭页面或窗口',
  aboutMenu: '关于 Orochi Harness',
  aboutProduct: 'Orochi Harness',
  aboutVersion: '版本 V{version}',
  hideApplication: '隐藏 Orochi Harness',
  hideOtherApplications: '隐藏其他',
  showAllApplications: '显示全部',
  quitApplication: '退出 Orochi Harness',
  openApplication: '打开 Orochi Harness',
  quit: '退出',
  cancel: '取消',
  quitTitle: '退出 Orochi Harness？',
  quitActiveTasks: '当前正在运行的任务将会中断',
  quitScheduledTasks: '应用关闭期间，定时任务不会运行',
  quitActiveAndScheduledTasks: '当前正在运行的任务将会中断，且应用关闭期间，定时任务不会运行',
  backgroundNoticeBody: '正在运行的任务不会中断，可在系统托盘中重新打开窗口',
  backgroundNoticeConfirm: '确认',
  edit: '编辑',
  menuBar: '应用菜单',
  delete: '删除',
  undo: '撤销',
  redo: '重做',
  cut: '剪切',
  copy: '复制',
  paste: '粘贴',
  selectAll: '全选',
  startupFailed: 'Orochi Harness 无法使用',
  fatalSummary: '应用无法启动或已意外停止。',
  startupAddressInUse: '有其他正在运行的 OH（如其他 oh web、桌面端），无法同时启动，请退出其他正在运行的 OH 后重启。',
  diagnosticTruncated: '… 错误详情已截短。',
  reportWrittenTo: '诊断报告：{path}',
  startupReinstallAdvice: '如果应用文件缺失或损坏，请关闭应用并重新安装。任务数据存储在独立位置。',
  exitApplication: '退出',
  restartApplication: '重启',
  recoveryOperationFailed: '恢复操作失败',
  disableThirdPartyPlugins: '禁用第三方插件、备份 profile patch 并重启',
  welcomeTitle: 'Orochi Harness',
  welcomeBrand: 'Orochi Harness',
  welcomeTaglineBefore: '欢迎使用 ',
  welcomeTaglineBrand: 'Orochi Harness',
  welcomeTaglineAfter: '',
  welcomeDescription: '开源必胜',
  welcomeApiKey: '添加 API Key',
  welcomeKeyTitle: '添加一个 API Key 开始使用',
  welcomeKeyDescription: '配置 OpenRouter API Key，即可开始使用',
  welcomeKeyPlaceholder: '输入 API 密钥',
  welcomeKeySave: '保存并继续',
  welcomeKeyLater: '稍后配置',
  welcomeKeyBack: '返回',
  welcomeKeyBlank: '请输入 API 密钥。',
  welcomeKeyInvalid: '请仅输入 API 密钥，不要包含引号、空格或环境变量赋值。',
  welcomeKeyFailed: '无法保存 API 密钥，请重试。',
  welcomeContinueFailed: '无法打开工作区，请重试。',
  checkUpdatesMenu: '检查更新…',
  reloadPageMenu: '刷新页面',
  restartAppHostMenu: '重启应用与 Host',
  updateCheckFailedTitle: '更新检查失败',
  updateCheckFailed: '检查更新失败，请稍后重试。',
  updateDownloadFailed: '下载更新失败，请重试。',
  updateInstallFailed: '安装更新失败，请稍后重试。',
  updateCheckNetworkFailed: '检查更新失败，请检查网络连接后重试。',
  updateDownloadNetworkFailed: '下载更新失败，请检查网络连接后重试。',
  updateInstallNetworkFailed: '安装更新失败，请检查网络连接后重试。',
  unknownError: '未知错误',
  updateCheckTitle: '检查更新',
  updateCurrentDetail: '当前版本：{version}',
  updateCurrent: '已是最新版本',
  updateChecking: '正在检查更新…',
  updateDownload: '下载更新',
  updateDownloadedTitle: '新版本 {version} 已准备就绪',
  updateDownloadedDetail: '更新期间应用将暂时关闭，完成后会自动打开。',
  updateDownloadedDetailWindows: '更新期间应用将暂时关闭，完成后会自动打开。\n\n更新可能需要一些时间，请耐心等待，期间请勿重复启动应用。',
  updateClose: '关闭',
  updateAcknowledge: '确定',
  updateLater: '稍后更新',
  updateDownloading: '正在下载 {percent}%…',
  updateVerifying: '正在校验更新文件…',
  updateInstalling: '正在准备重启…',
  updateRetry: '重试更新',
  updateActiveTasks: '仍有进行中的任务',
  updateActiveTasksDetail: '更新将停止进行中的任务并重启应用，是否继续？',
  updateStopTasks: '停止任务并更新',
  updateTasksChanged: '有新任务开始运行，请重新确认是否停止任务并更新。',
  updateTasksUnavailable: '无法确认任务状态，请在工作区就绪后重试更新。',
  updateStopFailed: '未能安全停止任务，更新尚未安装，请稍后重试。',
  updateTechnicalDetails: '查看技术详情',
  updateTitle: 'Orochi Harness 更新',
  updateAvailable: '发现新版本 {version}',
  updateDetail: '下载完成后，可安装并重启应用。',
  installAndRestart: '安装并重启',
  later: '稍后',
  updateFailedTitle: '更新失败',
} as const satisfies DesktopMessages

/** Locale payload exposed to the Desktop-owned renderer. */
export interface DesktopLocale {
  readonly id: 'en' | 'zh-CN'
  readonly messages: DesktopMessages
}

/** Resolve Electron's locale to one shipped Desktop dictionary. */
export function resolveDesktopLocale(locale: string): DesktopLocale {
  return locale.toLowerCase().startsWith('zh')
    ? { id: 'zh-CN', messages: zh }
    : { id: 'en', messages: en }
}

/**
 * Choose a built-in dictionary from the shared preference, then ordered OS languages.
 * @param preference - explicit locale.preference, or null when no language was selected.
 * @param languages - operating-system languages in preference order.
 * @returns the supported dictionary, falling back to English.
 */
export function resolveDesktopStartupLocale(preference: string | null, languages: readonly string[]): DesktopLocale {
  const selected = preference?.toLowerCase()
  if (selected === 'zh' || selected === 'en') return resolveDesktopLocale(selected)
  for (const language of languages) {
    const primary = language.toLowerCase().split('-')[0]
    if (primary === 'zh' || primary === 'en') return resolveDesktopLocale(primary)
  }
  return resolveDesktopLocale('en')
}

/** Replace named placeholders in one locale-owned message. */
export function formatDesktopMessage(
  message: string,
  values: Readonly<Record<string, string>>,
): string {
  return message.replaceAll(/\{([^{}]+)\}/gu, (placeholder, key: string) => values[key] ?? placeholder)
}

/**
 * Select localized copy for an ordinary downloaded-update confirmation.
 * @param messages - Selected Desktop dictionary.
 * @param version - Prepared update version, including any prerelease suffix.
 * @param platform - Operating system presenting the confirmation.
 * @returns The versioned title and installation guidance.
 */
export function desktopUpdateReadyConfirmation(
  messages: DesktopMessages,
  version: string,
  platform: string,
): { message: string; detail: string } {
  return {
    message: formatDesktopMessage(messages.updateDownloadedTitle, { version }),
    detail: platform === 'win32' ? messages.updateDownloadedDetailWindows : messages.updateDownloadedDetail,
  }
}
