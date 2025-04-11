import { computed, ref, watch } from 'vue'
import { darkTheme } from 'naive-ui'
const ipcRenderer = window.electron.ipcRenderer

export enum EThemeType {
  SYSTEM = 'system',
  DARK = 'dark',
  LIGHT = 'light',
}

const themeMode = ref<EThemeType>(EThemeType.SYSTEM)

watch(themeMode, (theme: EThemeType) => {
  themeMode.value = theme
  ipcRenderer.invoke('switch-theme', theme)
})

const isLight = window.matchMedia('(prefers-color-scheme: light)').matches
const currentTheme = ref<EThemeType>(isLight ? EThemeType.LIGHT : EThemeType.DARK)
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
  const theme = e.matches ? EThemeType.LIGHT : EThemeType.DARK
  currentTheme.value = theme
})

const themeConfig = computed(() => {
  if (currentTheme.value === EThemeType.DARK) {
    return darkTheme
  }
  return null
})

// 初始应用窗口主题
const initTheme = await ipcRenderer.invoke('current-theme')
themeMode.value = initTheme

// 主题变化更新（多窗口store独立，需要手动更新）
ipcRenderer.on('switch-theme', (_, type: EThemeType) => {
  themeMode.value = type
})

export const useTheme = () => {
  return {
    themeMode,
    currentTheme,
    themeConfig,
  }
}
