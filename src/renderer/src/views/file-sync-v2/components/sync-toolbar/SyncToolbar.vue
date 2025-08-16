<script setup lang="ts">
import { useFileList } from '@renderer/composables/file-sync-v2/useFileList'
import { useSyncForm } from '@renderer/composables/file-sync-v2/useSyncForm'
import { Folder, Pause, Play, Stop, SwapHorizontal } from '@vicons/ionicons5'
import { computed } from 'vue'
import { mockDiffFileList } from '@renderer/composables/file-sync-v2/mock'
import { useIgnoredFoldersModal } from '@renderer/composables/file-sync-v2/useIgnoredFoldersModal'

const { syncForm, isFormCompleted, isComparing, isSyncing } = useSyncForm()
const { diffFileList } = useFileList()
const { openIgnoredFoldersModal } = useIgnoredFoldersModal()

const compareButtonType = computed(() => {
  if (isComparing.value || isSyncing.value) return ''
  if (isFormCompleted.value) return 'primary'
  return ''
})

const stopButtonType = computed(() => {
  if (isComparing.value) return 'error'
  return ''
})

const syncButtonType = computed(() => {
  if (isComparing.value || isSyncing.value) return ''
  if (isFormCompleted.value && diffFileList.value.length > 0) return 'info'
  return ''
})

const pauseButtonType = computed(() => {
  if (isSyncing.value) return 'warning'
  return ''
})

function mockCompare() {
  diffFileList.value = mockDiffFileList
  isComparing.value = true
}
</script>

<template>
  <div class="sync-toolbar">
    <n-button
      size="small"
      :type="compareButtonType"
      :disabled="!isFormCompleted || isSyncing"
      :loading="isComparing"
      @click="mockCompare"
    >
      <template #icon><SwapHorizontal /></template>
      {{ $t('views.fileSyncV2.compare') }}
    </n-button>

    <n-button
      size="small"
      :type="stopButtonType"
      :disabled="!isComparing"
      @click="isComparing = false"
    >
      <template #icon><Stop /></template>
      {{ $t('views.fileSyncV2.stop') }}
    </n-button>

    <n-button
      size="small"
      :type="syncButtonType"
      :disabled="!(isFormCompleted && diffFileList.length > 0) || isComparing"
      :loading="isSyncing"
      @click="isSyncing = true"
    >
      <template #icon><Play /></template>
      {{ $t('views.fileSyncV2.startSync') }}
    </n-button>

    <n-button
      size="small"
      :type="pauseButtonType"
      :disabled="!isSyncing"
      @click="isSyncing = false"
    >
      <template #icon><Pause /></template>
      {{ $t('views.fileSyncV2.pauseSync') }}
    </n-button>

    <n-badge :value="syncForm.ignoredFolders.length" type="success" style="margin-left: auto">
      <n-button size="small" @click="openIgnoredFoldersModal">
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
