import { ref, watch } from 'vue'

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
window.events.on('theme:switch', (type: EThemeType) => {
  themeMode.value = type
})

let initThemeColor = themeMode.value
if (initThemeColor === EThemeType.SYSTEM) {
  const isLight = window.matchMedia('(prefers-color-scheme: light)').matches
  initThemeColor = isLight ? EThemeType.LIGHT : EThemeType.DARK
}
const currentTheme = ref<EThemeType>(initThemeColor)
// 监听系统主题自动变化
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
  const theme = e.matches ? EThemeType.LIGHT : EThemeType.DARK
  currentTheme.value = theme
  document.documentElement.className = theme
})

export const useTheme = () => {
  return {
    themeMode,
    currentTheme,
  }
}
