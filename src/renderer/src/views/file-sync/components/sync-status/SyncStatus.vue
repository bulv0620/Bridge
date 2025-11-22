<script setup lang="ts">
import { useActiveSyncSession } from '@renderer/composables/file-sync/useActiveSyncSession'
import { formatBytes } from '@renderer/utils/format'
import { computed } from 'vue'

const { activeSessionState } = useActiveSyncSession()

const percentage = computed(() => {
  if (activeSessionState.value.status.totalCount === 0) return 0
  return Math.round(
    (activeSessionState.value.status.transferredCount /
      activeSessionState.value.status.totalCount) *
      100,
  )
})
</script>

<template>
  <div class="sync-status">
    <el-text class="text">
      {{ formatBytes(activeSessionState.status.bytesTransferred) }}/{{
        formatBytes(activeSessionState.status.totalBytes)
      }}
    </el-text>
    <div class="progress-wrapper">
      <el-text class="text">
        {{ activeSessionState.status.transferredCount }}/{{ activeSessionState.status.totalCount }}
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
