<script setup lang="ts">
import { formatBytesPerSecond } from '@renderer/utils/format'
import { useTaskList } from '@renderer/composables/downloader/useTaskList'

const { globalStats } = useTaskList()
</script>

<template>
  <n-space style="font-size: 14px">
    <span>
      {{ $t('views.downloader.uploadSpeed') }}:
      {{ formatBytesPerSecond(globalStats?.uploadSpeed || 0) }}
    </span>
    <span>
      {{ $t('views.downloader.downloadSpeed') }}:
      {{ formatBytesPerSecond(globalStats?.downloadSpeed || 0) }}
    </span>
  </n-space>
</template>
