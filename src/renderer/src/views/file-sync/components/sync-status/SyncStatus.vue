<script setup lang="ts">
import { useActiveSyncSession } from '@renderer/composables/file-sync/useActiveSyncSession'
import { formatBytes } from '@renderer/utils/format'
import { computed } from 'vue'
import { ChevronBack, ChevronForward, Ban, PieChart } from '@vicons/ionicons5'

const { activeSessionState } = useActiveSyncSession()

const percentage = computed(() => {
  if (activeSessionState.value!.status.totalCount === 0) return 0
  return Math.round(
    (activeSessionState.value!.status.transferredCount /
      activeSessionState.value!.status.totalCount) *
      100,
  )
})
</script>

<template>
  <div class="sync-status">
    <el-text class="text">
      <el-icon><PieChart></PieChart></el-icon>
      {{ activeSessionState!.status.transferredCount }}/{{ activeSessionState!.status.totalCount }}
    </el-text>
    <el-text type="primary">
      <el-icon><ChevronForward></ChevronForward></el-icon>
      {{ activeSessionState!.status.toRightCount }}
    </el-text>
    <el-text type="success">
      <el-icon><ChevronBack></ChevronBack></el-icon>
      {{ activeSessionState!.status.toLeftCount }}
    </el-text>
    <el-text type="info">
      <el-icon><Ban></Ban></el-icon>
      {{ activeSessionState!.status.ignoreCount }}
    </el-text>

    <div class="progress-wrapper">
      <el-text class="text">
        {{ formatBytes(activeSessionState!.status.bytesTransferred) }}/{{
          formatBytes(activeSessionState!.status.totalBytes)
        }}
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
  gap: 12px;
}

.text {
  font-size: 14px;
}

.progress-wrapper {
  margin-left: auto;
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
