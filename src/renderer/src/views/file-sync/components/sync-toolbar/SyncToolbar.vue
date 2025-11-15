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

// 按钮类型映射到 Element Plus
const compareButtonType = computed(() => {
  if (isComparing.value || isSyncing.value) return ''
  if (isFormCompleted.value) return 'primary'
  return ''
})

const stopButtonType = computed(() => {
  if (isComparing.value) return 'danger'
  return ''
})

const syncButtonType = computed(() => {
  if (isComparing.value || isSyncing.value) return ''
  if (isFormCompleted.value && diffFileList.value.length > 0) return 'success'
  return ''
})

const pauseButtonType = computed(() => {
  if (isSyncing.value) return 'warning'
  return ''
})
</script>

<template>
  <div class="sync-toolbar">
    <!-- 比较按钮 -->
    <el-button
      :type="compareButtonType"
      :disabled="!isFormCompleted || isSyncing"
      :loading="isComparing"
      :icon="SwapHorizontal"
      @click="startCompare"
    >
      {{ $t('views.fileSync.compare') }}
    </el-button>

    <!-- 停止比较 -->
    <el-button :type="stopButtonType" :disabled="!isComparing" :icon="Stop" @click="stopCompare">
      {{ $t('views.fileSync.stop') }}
    </el-button>

    <!-- 开始同步 -->
    <el-button
      :type="syncButtonType"
      :disabled="!(isFormCompleted && diffFileList.length > 0) || isComparing"
      :loading="isSyncing"
      :icon="Play"
      @click="startSync"
    >
      {{ $t('views.fileSync.startSync') }}
    </el-button>

    <!-- 暂停同步 -->
    <el-button :type="pauseButtonType" :disabled="!isSyncing" :icon="Pause" @click="stopSync">
      {{ $t('views.fileSync.pauseSync') }}
    </el-button>

    <!-- 忽略文件夹 badge -->
    <el-badge
      :show-zero="false"
      :value="syncForm.ignoredFolders.length"
      type="success"
      style="margin-left: auto"
    >
      <el-button
        :disabled="isComparing || isSyncing"
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
