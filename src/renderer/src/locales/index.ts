import { createI18n } from 'vue-i18n'
import en_US from './en_US.json'
import zh_CN from './zh_CN.json'

export const i18n = createI18n({
  locale: 'en_US',
  legacy: false,
  globalInjection: true,
  messages: {
    zh_CN,
    en_US,
  },
})

export const languageOptions = [
  {
    label: 'English',
    value: 'en_US',
  },
  {
    label: '中文',
    value: 'zh_CN',
  },
]
