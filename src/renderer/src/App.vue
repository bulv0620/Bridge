<script setup lang="ts">
import { nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useLang } from './composables/setting/useLang'
import { useTaskList } from './composables/share-zone/useTaskList'
import layout from './layout/layout.vue'

const { elLocale } = useLang()
const { activeTab } = useTaskList()
const router = useRouter()

function openPage(data: HrefToPageParam) {
  void router.push({
    name: data.to,
    query: data.query,
  })
}

async function prepareIncomingBatch(requestId: unknown) {
  if (typeof requestId !== 'string') return
  try {
    await router.push({ name: 'SharedZone' })
    await nextTick()
  } finally {
    await window.ipc.share.acknowledgeIncomingBatchNavigation(requestId).catch(() => false)
  }
}

function showIncomingBatch() {
  activeTab.value = 2
  void router.push({ name: 'SharedZone' })
}

window.events.on('page:link', openPage)
window.events.on('share:incoming-batch', prepareIncomingBatch)
window.events.on('share:incoming-batch-accepted', showIncomingBatch)

onBeforeUnmount(() => {
  window.events.off('page:link', openPage)
  window.events.off('share:incoming-batch', prepareIncomingBatch)
  window.events.off('share:incoming-batch-accepted', showIncomingBatch)
})
</script>

<template>
  <el-config-provider :locale="elLocale">
    <layout></layout>
  </el-config-provider>
</template>
