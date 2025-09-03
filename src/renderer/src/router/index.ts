import { createRouter, createWebHashHistory } from 'vue-router'

import FileSync from '@renderer/views/file-sync/index.vue'
import PluginCenter from '@renderer/views/plugin-center/index.vue'
import Setting from '@renderer/views/setting/index.vue'
import Downloader from '@renderer/views/downloader/index.vue'
import ShareHub from '@renderer/views/share-hub/index.vue'

const routes = [
  { name: 'FileSync', path: '/', component: FileSync },
  { name: 'PluginCenter', path: '/plugin-center', component: PluginCenter },
  { name: 'Setting', path: '/setting', component: Setting },
  { name: 'Downloader', path: '/downloader', component: Downloader },
  { name: 'ShareHub', path: '/share-hub', component: ShareHub },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
