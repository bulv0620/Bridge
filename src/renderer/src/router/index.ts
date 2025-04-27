import { createRouter, createWebHashHistory } from 'vue-router'

import FileSync from '@renderer/views/file-sync/index.vue'
import FileShare from '@renderer/views/file-share/index.vue'
import Setting from '@renderer/views/setting/index.vue'

const routes = [
  { path: '/', component: FileSync },
  { path: '/tico-share', component: FileShare },
  { path: '/setting', component: Setting },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
