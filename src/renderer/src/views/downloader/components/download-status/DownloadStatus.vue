<script setup lang="ts">
import { formatBytesPerSecond } from '@renderer/utils/format'
import { useTaskList } from '@renderer/composables/downloader/useTaskList'

const { globalStats } = useTaskList()
</script>

<template>
  <div style="display: flex; gap: 12px; font-size: 14px">
    <span>
      {{ $t('views.downloader.uploadSpeed') }}:
      {{ formatBytesPerSecond(globalStats?.uploadSpeed || 0) }}
    </span>
    <span>
      {{ $t('views.downloader.downloadSpeed') }}:
      {{ formatBytesPerSecond(globalStats?.downloadSpeed || 0) }}
    </span>
  </div>
</template>
