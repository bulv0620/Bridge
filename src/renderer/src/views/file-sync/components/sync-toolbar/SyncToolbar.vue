<script setup lang="ts">
import { EllipsisHorizontal, Folder, Pause, Play, Stop, SwapHorizontal } from '@vicons/ionicons5'
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

type ToolbarCommand = 'ignored-folders'

function handleToolbarCommand(command: ToolbarCommand) {
  if (command === 'ignored-folders') openIgnoredFoldersModal()
}
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

    <div class="toolbar-more">
      <el-dropdown
        trigger="click"
        placement="bottom-end"
        :show-arrow="false"
        popper-class="toolbar-more-popper"
        @command="handleToolbarCommand"
      >
        <el-badge
          class="toolbar-more-badge"
          :show-zero="false"
          :value="activeSessionState!.formData.ignoredFolders.length"
          type="success"
        >
          <el-button
            class="more-trigger"
            circle
            :icon="EllipsisHorizontal"
            :title="$t('common.more')"
            :aria-label="$t('common.more')"
          />
        </el-badge>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              command="ignored-folders"
              :icon="Folder"
              :disabled="activeSessionState!.isComparing || activeSessionState!.isSyncing"
            >
              {{ $t('views.fileSync.ignoredFolders') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style lang="less" scoped>
.sync-toolbar {
  min-width: 0;
  padding: 12px var(--bridge-page-padding) 0;
  display: flex;
  align-items: center;
  gap: 8px;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }

  :deep(.el-badge) {
    flex-shrink: 0;
  }

  .toolbar-more {
    margin-left: auto;
    flex-shrink: 0;
    display: flex;
  }

  .more-trigger {
    width: 36px;
    min-width: 36px;
    padding: 0;
  }
}

@media (max-width: 760px) {
  .sync-toolbar {
    overflow-x: auto;

    :deep(.el-button span) {
      display: none;
    }
  }
}
</style>
