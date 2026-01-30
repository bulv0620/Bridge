import { useI18n } from 'vue-i18n'
import { computed, watch } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import { useRemoteRef } from '../remote-ref/useRemoteRef'

export const useLang = () => {
  const currentLocale = useRemoteRef<Locales>('current-locale', 'en_US')

  const { locale } = useI18n()

  watch(
    () => currentLocale.value,
    (val) => {
      locale.value = val
    },
  )

  const elLocale = computed(() => {
    if (currentLocale.value === 'zh_CN') {
      return zhCn
    }
    return en
  })

  return {
    currentLocale,
    elLocale,
  }
}
