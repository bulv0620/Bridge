import { useI18n } from 'vue-i18n'
import { computed, watch } from 'vue'
import { zhCN, dateZhCN, enUS, dateEnUS } from 'naive-ui'

export const useLang = () => {
  const { locale } = useI18n()
  const ipcRenderer = window.electron.ipcRenderer

  // 主题变化更新（多窗口store独立，需要手动更新）
  ipcRenderer.on('switch-lang', (_, lang: string) => {
    locale.value = lang
  })

  // 向渲染线程更新lang
  watch(
    locale,
    (lang) => {
      ipcRenderer.invoke('switch-lang', lang)
      localStorage.setItem('lang', lang)
    },
    { immediate: true },
  )

  const naiveLocale = computed(() => {
    if (locale.value === 'zh_CN') {
      return zhCN
    }
    return enUS
  })

  const naiveDateLocale = computed(() => {
    if (locale.value === 'zh_CN') {
      return dateZhCN
    }
    return dateEnUS
  })

  return {
    naiveLocale,
    naiveDateLocale,
  }
}
