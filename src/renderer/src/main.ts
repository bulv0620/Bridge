import './assets/reset.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import naive from 'naive-ui'
import { i18n } from './locales/index'

const app = createApp(App)
app.use(router)
app.use(naive)
app.use(i18n)
app.mount('#app')
