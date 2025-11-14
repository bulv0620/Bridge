import './assets/reset.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import naive from 'naive-ui'
import { i18n } from './locales/index'
import CommonButton from './components/CommonButton.vue'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

const app = createApp(App)
app.use(router)
app.use(naive)
app.use(i18n)
app.use(ElementPlus)
app.component('CommonButton', CommonButton)
app.mount('#app')
