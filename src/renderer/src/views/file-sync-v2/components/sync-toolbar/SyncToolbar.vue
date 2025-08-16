<script setup lang="ts">
import { Folder, Pause, Play, Stop, SwapHorizontal } from '@vicons/ionicons5'
</script>

<template>
  <div class="sync-toolbar">
    <n-button size="small" type="primary">
      <template #icon><SwapHorizontal /></template>
      {{ $t('views.fileSyncV2.compare') }}
    </n-button>
    <n-button size="small">
      <template #icon><Play /></template>
      {{ $t('views.fileSyncV2.startSync') }}
    </n-button>
    <n-button size="small">
      <template #icon><Pause /></template>
      {{ $t('views.fileSyncV2.pauseSync') }}
    </n-button>
    <n-button size="small">
      <template #icon><Stop /></template>
      {{ $t('views.fileSyncV2.stop') }}
    </n-button>
    <n-badge :value="5" type="success" style="margin-left: auto">
      <n-button size="small">
        <template #icon><Folder /></template>
        {{ $t('views.fileSyncV2.ignoredFolders') }}
      </n-button>
    </n-badge>
  </div>
</template>

<style lang="less" scoped>
.sync-toolbar {
  padding: 16px;
  padding-bottom: 0;
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
