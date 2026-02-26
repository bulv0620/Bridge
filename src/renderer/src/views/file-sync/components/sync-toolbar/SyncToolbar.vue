<script setup lang="ts">
import { Folder, Pause, Play, Stop, SwapHorizontal } from '@vicons/ionicons5'
import { computed } from 'vue'
import { useIgnoredFoldersModal } from '@renderer/composables/file-sync/useIgnoredFoldersModal'
import { useActiveSyncSession } from '@renderer/composables/file-sync/useActiveSyncSession'

const { activeSessionState, activeSession } = useActiveSyncSession()

const { openIgnoredFoldersModal } = useIgnoredFoldersModal()

const isFormCompleted = computed(() => {
  return (
    !!activeSessionState.value!.formData.sourceConfig &&
    !!activeSessionState.value!.formData.destinationConfig
  )
})

// 按钮类型映射到 Element Plus
const compareButtonType = computed(() => {
  if (activeSessionState.value!.isComparing || activeSessionState.value!.isSyncing) return ''
  if (isFormCompleted.value) return 'primary'
  return ''
})

const stopButtonType = computed(() => {
  if (activeSessionState.value!.isComparing) return 'danger'
  return ''
})

const syncButtonType = computed(() => {
  if (activeSessionState.value!.isComparing || activeSessionState.value!.isSyncing) return ''
  if (isFormCompleted.value && activeSessionState.value!.tableData.length > 0) return 'success'
  return ''
})

const pauseButtonType = computed(() => {
  if (activeSessionState.value!.isSyncing) return 'warning'
  return ''
})
</script>

<template>
  <div class="sync-toolbar">
    <!-- 比较按钮 -->
    <el-button
      :type="compareButtonType"
      :disabled="!isFormCompleted || activeSessionState!.isSyncing"
      :loading="activeSessionState!.isComparing"
      :icon="SwapHorizontal"
      @click="activeSession!.startCompare"
    >
      {{ $t('views.fileSync.compare') }}
    </el-button>

    <!-- 停止比较 -->
    <el-button
      :type="stopButtonType"
      :disabled="!activeSessionState!.isComparing"
      :icon="Stop"
      @click="activeSession!.stopCompare"
    >
      {{ $t('views.fileSync.stop') }}
    </el-button>

    <!-- 开始同步 -->
    <el-button
      :type="syncButtonType"
      :disabled="
        !(isFormCompleted && activeSessionState!.tableData.length > 0) ||
        activeSessionState!.isComparing
      "
      :loading="activeSessionState!.isSyncing"
      :icon="Play"
      @click="activeSession!.startSync"
    >
      {{ $t('views.fileSync.startSync') }}
    </el-button>

    <!-- 暂停同步 -->
    <el-button
      :type="pauseButtonType"
      :disabled="!activeSessionState!.isSyncing"
      :icon="Pause"
      @click="activeSession!.stopSync"
    >
      {{ $t('views.fileSync.pauseSync') }}
    </el-button>

    <!-- 忽略文件夹 badge -->
    <el-badge
      :show-zero="false"
      :value="activeSessionState!.formData.ignoredFolders.length"
      type="success"
      style="margin-left: auto"
    >
      <el-button
        :disabled="activeSessionState!.isComparing || activeSessionState!.isSyncing"
        :icon="Folder"
        @click="openIgnoredFoldersModal"
      >
        {{ $t('views.fileSync.ignoredFolders') }}
      </el-button>
    </el-badge>
  </div>
</template>

<style lang="less" scoped>
.sync-toolbar {
  padding: 16px;
  padding-bottom: 0;
  display: flex;
  align-items: center;
}
</style>
