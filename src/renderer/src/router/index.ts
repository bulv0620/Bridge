import { createRouter, createWebHashHistory } from 'vue-router'

import FileSync from '@renderer/views/file-sync/index.vue'
import PluginCenter from '@renderer/views/plugin-center/index.vue'
import Setting from '@renderer/views/setting/index.vue'
import FtpClient from '@renderer/views/ftp-client/index.vue'

const routes = [
  { path: '/', component: FileSync },
  { path: '/plugin-center', component: PluginCenter },
  { path: '/setting', component: Setting },
  { path: '/ftp-client', component: FtpClient },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
