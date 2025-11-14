import { useI18n } from 'vue-i18n'
import { computed, watch } from 'vue'
import { zhCN as nZhCn, dateZhCN, enUS as nEnUs, dateEnUS } from 'naive-ui'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'

export const useLang = () => {
  const { locale } = useI18n()

  // 主题变化更新（多窗口store独立，需要手动更新）
  window.events.on('lang:switch', (lang: string) => {
    locale.value = lang
  })

  // 向渲染线程更新lang
  watch(
    locale,
    (lang) => {
      window.ipc.lang.change(lang)
      localStorage.setItem('lang', lang)
    },
    { immediate: true },
  )

  const elLocale = computed(() => {
    if (locale.value === 'zh_CN') {
      return zhCn
    }
    return en
  })

  const naiveLocale = computed(() => {
    if (locale.value === 'zh_CN') {
      return nZhCn
    }
    return nEnUs
  })

  const naiveDateLocale = computed(() => {
    if (locale.value === 'zh_CN') {
      return dateZhCN
    }
    return dateEnUS
  })

  return {
    elLocale,
    naiveLocale,
    naiveDateLocale,
  }
}
