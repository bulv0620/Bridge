import { nativeTheme } from 'electron'
import { remoteRef } from '../utils/remoteRef'
import { getStore } from '../store'

const store = getStore()

// 初始化主题
nativeTheme.themeSource = store.get('theme')
const themeMode = remoteRef('theme-mode', nativeTheme.themeSource)
const currentTheme = remoteRef('current-theme', nativeTheme.shouldUseDarkColors ? 'dark' : 'light')

nativeTheme.on('updated', () => {
  currentTheme.value = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
})

themeMode.onUpdate((mode: ThemeMode) => {
  nativeTheme.themeSource = mode
  store.set('theme', themeMode.value)
})
