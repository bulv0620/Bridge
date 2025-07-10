import './assets/reset.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import naive from 'naive-ui'
import { i18n } from './locales/index'
import CommonButton from './components/CommonButton.vue'

const app = createApp(App)
app.use(router)
app.use(naive)
app.use(i18n)
app.component('CommonButton', CommonButton)
app.mount('#app')
