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
  <div class="sync-status">
    <el-text class="text">
      {{ formatBytes(syncStatus.bytesTransferred) }}/{{ formatBytes(syncStatus.totalBytes) }}
    </el-text>
    <div class="progress-wrapper">
      <el-text class="text">
        {{ syncStatus.transferredCount }}/{{ syncStatus.totalCount }}
      </el-text>
      <el-progress class="progress" :percentage="percentage"></el-progress>
    </div>
  </div>
</template>

<style lang="less" scoped>
.sync-status {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.text {
  font-size: 14px;
}

.progress-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.progress {
  width: 180px;
}

:deep(.el-progress__text) {
  font-size: 14px;
  min-width: auto;
}
</style>
