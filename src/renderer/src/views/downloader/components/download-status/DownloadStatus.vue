<script setup lang="ts">
import { formatBytesPerSecond } from '@renderer/utils/format'
import { useAria2 } from '@renderer/composables/downloader/useAria2'

const { isConnected, globalStats } = useAria2()
</script>

<template>
  <n-tag v-if="isConnected" size="small" type="success">
    {{ $t('views.downloader.connected') }}
  </n-tag>
  <n-tag v-else size="small" type="error">{{ $t('views.downloader.disconnected') }}</n-tag>
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
