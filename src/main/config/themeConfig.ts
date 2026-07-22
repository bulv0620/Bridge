import { BrowserWindow, nativeTheme } from 'electron'
import { remoteRef } from '../utils/remoteRef'
import { getStore } from '../store'
import { updateWindowTitleBarTheme } from '../utils/window'

const store = getStore()

// 初始化主题
nativeTheme.themeSource = store.get('theme')
export const themeMode = remoteRef('theme-mode', nativeTheme.themeSource)
export const currentTheme = remoteRef(
  'current-theme',
  nativeTheme.shouldUseDarkColors ? 'dark' : 'light',
)

export function initThemeConfig() {
  nativeTheme.on('updated', () => {
    currentTheme.value = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    BrowserWindow.getAllWindows().forEach(updateWindowTitleBarTheme)
  })

  themeMode.onUpdate((mode: ThemeMode) => {
    nativeTheme.themeSource = mode
    store.set('theme', themeMode.value)
  })
}
