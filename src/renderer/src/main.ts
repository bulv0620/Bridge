import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import { i18n } from './locales/index'

import { loadDirectives } from './directives'
import CommonDialog from './components/CommonDialog.vue'

import './assets/reset.css'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './assets/element-plus.less'
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'

const app = createApp(App)
app.use(router)
app.use(i18n)
app.use(ElementPlus)

app.component('CommonDialog', CommonDialog)

/** 加载自定义指令 */
loadDirectives(app)

app.mount('#app')
