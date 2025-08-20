<script setup lang="ts">
import { useSyncForm } from '@renderer/composables/file-sync-v2/useSyncForm'
import { formatBytes } from '@renderer/utils/format'

const { syncStatus } = useSyncForm()
</script>

<template>
  <n-space justify="space-between">
    <n-space>
      <n-text class="text">
        {{ formatBytes(syncStatus.bytesTransferred) }}/{{ formatBytes(syncStatus.totalBytes) }}
      </n-text>
      <n-progress class="progress" :percentage="0"></n-progress>
    </n-space>
    <n-text class="text"> {{ syncStatus.transferredCount }}/{{ syncStatus.totalCount }} </n-text>
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
