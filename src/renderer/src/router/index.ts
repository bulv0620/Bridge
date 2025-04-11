import { createRouter, createWebHashHistory } from 'vue-router'

import BackpackSync from '@renderer/views/backpack-sync/index.vue'
import TicoShare from '@renderer/views/tico-share/index.vue'
import Setting from '@renderer/views/setting/index.vue'

const routes = [
  { path: '/', component: BackpackSync },
  { path: '/tico-share', component: TicoShare },
  { path: '/setting', component: Setting },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
