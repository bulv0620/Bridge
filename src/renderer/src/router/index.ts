import { createRouter, createWebHashHistory } from 'vue-router'

import FileSync from '@renderer/views/file-sync/index.vue'
import Setting from '@renderer/views/setting/index.vue'
import ShareHub from '@renderer/views/share-hub/index.vue'
import SharedZone from '@renderer/views/shared-zone/index.vue'

const routes = [
  { name: 'FileSync', path: '/', component: FileSync },
  { name: 'Setting', path: '/setting', component: Setting },
  { name: 'ShareHub', path: '/share-hub', component: ShareHub },
  { name: 'SharedZone', path: '/shared-zone', component: SharedZone },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
