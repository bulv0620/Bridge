import { watch } from 'vue'
import { useRemoteRef } from '../remote-ref/useRemoteRef'

// 主题模式
const themeMode = useRemoteRef<ThemeMode>('theme-mode', 'system')
// 主题实际值
const currentTheme = useRemoteRef<Theme>('current-theme', 'light')

watch(
  () => currentTheme.value,
  (val) => {
    document.documentElement.className = val
  },
)

export const useTheme = () => {
  return {
    themeMode,
    currentTheme,
  }
}
