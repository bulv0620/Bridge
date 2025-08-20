import { computed, ref, watch } from 'vue'
import { darkTheme } from 'naive-ui'
import { VxeUI } from 'vxe-pc-ui'
const ipcRenderer = window.electron.ipcRenderer

export enum EThemeType {
  SYSTEM = 'system',
  DARK = 'dark',
  LIGHT = 'light',
}

// 主题模式
const themeMode = ref<EThemeType>(
  (localStorage.getItem('theme') as EThemeType) || EThemeType.SYSTEM,
)

// 更新theme模式
watch(
  themeMode,
  (theme: EThemeType) => {
    themeMode.value = theme
    localStorage.setItem('theme', theme)
    window.ipc.theme.change(theme)
  },
  { immediate: true },
)

// 监听主题更新（多窗口store独立，需要手动更新）
ipcRenderer.on('switch-theme', (_, type: EThemeType) => {
  themeMode.value = type
})

let initThemeColor = themeMode.value
if (initThemeColor === EThemeType.SYSTEM) {
  const isLight = window.matchMedia('(prefers-color-scheme: light)').matches
  initThemeColor = isLight ? EThemeType.LIGHT : EThemeType.DARK
}
const currentTheme = ref<EThemeType>(initThemeColor)
VxeUI.setTheme(initThemeColor)
// 监听系统主题自动变化
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
  const theme = e.matches ? EThemeType.LIGHT : EThemeType.DARK
  currentTheme.value = theme
  VxeUI.setTheme(theme)
})

const themeConfig = computed(() => {
  if (currentTheme.value === EThemeType.DARK) {
    return darkTheme
  }
  return null
})

export const useTheme = () => {
  return {
    themeMode,
    currentTheme,
    themeConfig,
  }
}
