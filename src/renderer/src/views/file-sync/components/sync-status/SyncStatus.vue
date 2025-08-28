<script setup lang="ts">
import { useSyncForm } from '@renderer/composables/file-sync/useSyncForm'
import { formatBytes } from '@renderer/utils/format'
import { computed } from 'vue'

const { syncStatus } = useSyncForm()

const percentage = computed(() => {
  if (syncStatus.totalCount === 0) return 0
  return Math.round((syncStatus.transferredCount / syncStatus.totalCount) * 100)
})
</script>

<template>
  <n-space justify="space-between">
    <n-text class="text">
      {{ formatBytes(syncStatus.bytesTransferred) }}/{{ formatBytes(syncStatus.totalBytes) }}
    </n-text>
    <n-space>
      <n-text class="text"> {{ syncStatus.transferredCount }}/{{ syncStatus.totalCount }} </n-text>
      <n-progress class="progress" :percentage="percentage"></n-progress>
    </n-space>
  </n-space>
</template>

<style lang="less" scoped>
.text {
  font-size: 14px;
}

.progress {
  width: 180px;
}
</style>
