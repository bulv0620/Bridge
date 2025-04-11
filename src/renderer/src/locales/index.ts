import { createI18n } from 'vue-i18n'
import en_US from './en_US.json'
import zh_CN from './zh_CN.json'

export const i18n = createI18n({
  locale: localStorage.getItem('lang') || 'en_US',
  legacy: false, // 如果要支持compositionAPI，此项必须设置为false;
  globalInjection: true, // 全局注册$t方法
  messages: {
    zh_CN,
    en_US,
  },
})

export const languageOptions = [
  {
    label: '中文',
    value: 'zh_CN',
  },
  {
    label: 'English',
    value: 'en_US',
  },
]
