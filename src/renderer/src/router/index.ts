import { createRouter, createWebHashHistory } from 'vue-router'

import FileSync from '@renderer/views/file-sync/index.vue'
import PluginCenter from '@renderer/views/plugin-center/index.vue'
import Setting from '@renderer/views/setting/index.vue'
import FtpClient from '@renderer/views/ftp-client2/index.vue'
import Downloader from '@renderer/views/downloader/index.vue'

const routes = [
  { name: 'fileSync', path: '/', component: FileSync },
  { name: 'pluginCenter', path: '/plugin-center', component: PluginCenter },
  { name: 'setting', path: '/setting', component: Setting },
  { name: 'ftpClient', path: '/ftp-client', component: FtpClient },
  { name: 'downloader', path: '/downloader', component: Downloader },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
