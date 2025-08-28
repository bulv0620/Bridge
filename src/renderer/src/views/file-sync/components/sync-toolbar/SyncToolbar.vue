<script setup lang="ts">
import { useFileList } from '@renderer/composables/file-sync/useFileList'
import { useSyncForm } from '@renderer/composables/file-sync/useSyncForm'
import { Folder, Pause, Play, Stop, SwapHorizontal } from '@vicons/ionicons5'
import { computed } from 'vue'
import { useIgnoredFoldersModal } from '@renderer/composables/file-sync/useIgnoredFoldersModal'

const {
  syncForm,
  isFormCompleted,
  isComparing,
  isSyncing,
  startCompare,
  stopCompare,
  startSync,
  stopSync,
} = useSyncForm()
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
</script>

<template>
  <div class="sync-toolbar">
    <n-button
      size="small"
      :type="compareButtonType"
      :disabled="!isFormCompleted || isSyncing"
      :loading="isComparing"
      @click="startCompare"
    >
      <template #icon><SwapHorizontal /></template>
      {{ $t('views.fileSync.compare') }}
    </n-button>

    <n-button size="small" :type="stopButtonType" :disabled="!isComparing" @click="stopCompare">
      <template #icon><Stop /></template>
      {{ $t('views.fileSync.stop') }}
    </n-button>

    <n-button
      size="small"
      :type="syncButtonType"
      :disabled="!(isFormCompleted && diffFileList.length > 0) || isComparing"
      :loading="isSyncing"
      @click="startSync"
    >
      <template #icon><Play /></template>
      {{ $t('views.fileSync.startSync') }}
    </n-button>

    <n-button size="small" :type="pauseButtonType" :disabled="!isSyncing" @click="stopSync">
      <template #icon><Pause /></template>
      {{ $t('views.fileSync.pauseSync') }}
    </n-button>

    <n-badge :value="syncForm.ignoredFolders.length" type="success" style="margin-left: auto">
      <n-button size="small" :disabled="isComparing || isSyncing" @click="openIgnoredFoldersModal">
        <template #icon><Folder /></template>
        {{ $t('views.fileSync.ignoredFolders') }}
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
