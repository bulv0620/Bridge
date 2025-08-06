<script setup lang="ts">
import { SwapHorizontal, List, Pause, Play } from '@vicons/ionicons5'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NIcon } from 'naive-ui'
import FolderWhiteListModal from './components/folder-white-list-modal/FolderWhiteListModal.vue'
import FolderSelectionInput from './components/folder-selection-input/FolderSelectionInput.vue'
import DiffDataTable from './components/diff-data-table/DiffDataTable.vue'
import PlanControl from './components/plan-control/PlanControl.vue'
import FtpConfigModal from './components/ftp-config-modal/FtpConfigModal.vue'
import { useDiffList } from '@renderer/composables/file-sync/useDiffList'
import { DiffFile, useSyncTool } from '@renderer/composables/file-sync/useSyncTool'
import { useFolderWhiteList } from '@renderer/composables/file-sync/useFolderWhiteList'
import { useSyncForm } from '@renderer/composables/file-sync/useSyncForm'
import { useFileDiff } from '@renderer/composables/file-sync/useFileDiff'
import { useFileSync } from '@renderer/composables/file-sync/useFileSync'

defineOptions({
  name: 'FileSync',
})

const { t } = useI18n()

const { loading, diffTableData, processing, hasWaitingFile } = useDiffList()
const { getDiffAction } = useSyncTool()
const { whiteList: folderWhiteList, openWhiteListModal } = useFolderWhiteList()
const { sourceFolder, targetFolder, syncType, syncOptions, percentage, pauseFlag } = useSyncForm()
const { startDiff } = useFileDiff()
const { syncProgressTxt, startSync, pauseSync } = useFileSync()

const planName = ref(t('views.fileSync.newPlan'))

watch(syncType, (type) => {
  diffTableData.value.forEach((diffFile: DiffFile) => {
    diffFile.action = getDiffAction(diffFile, type)
  })
})
watch(
  sourceFolder,
  () => {
    diffTableData.value = []
    percentage.value = 0
  },
  { deep: true },
)
watch(
  targetFolder,
  () => {
    diffTableData.value = []
    percentage.value = 0
  },
  { deep: true },
)
</script>

<template>
  <div class="file-sync">
    <div class="container">
      <!-- 方案栏 -->

      <PlanControl
        v-model:plan-name="planName"
        v-model:source-folder="sourceFolder"
        v-model:target-folder="targetFolder"
        v-model:folder-white-list="folderWhiteList"
        v-model:sync-type="syncType"
        :processing="processing"
      ></PlanControl>

      <!-- 目录选择栏 -->
      <n-flex :wrap="false">
        <FolderSelectionInput
          v-model:value="sourceFolder"
          type="source"
          :processing="processing"
        ></FolderSelectionInput>
        <n-popover
          trigger="hover"
          :delay="500"
          :disabled="!sourceFolder.path || !targetFolder.path || processing"
        >
          <template #trigger>
            <n-button
              circle
              :disabled="!sourceFolder.path || !targetFolder.path || processing"
              :loading="loading"
              @click="startDiff"
            >
              <template #icon>
                <n-icon> <SwapHorizontal /> </n-icon>
              </template>
            </n-button>
          </template>
          <span>{{ $t('views.fileSync.contrast') }}</span>
        </n-popover>

        <FolderSelectionInput
          v-model:value="targetFolder"
          type="target"
          :processing="processing"
        ></FolderSelectionInput>
      </n-flex>

      <!-- 同步操作栏 -->
      <n-flex :wrap="false" align="center">
        <n-select
          v-model:value="syncType"
          :options="syncOptions"
          style="width: 180px"
          :disabled="processing"
        />
        <n-button v-if="processing" type="warning" :loading="pauseFlag" @click="pauseSync">
          <template #icon>
            <n-icon> <Pause /> </n-icon>
          </template>
          {{ $t('views.fileSync.stopSync') }}
        </n-button>
        <n-button
          v-else
          :disabled="diffTableData.length === 0 || !hasWaitingFile"
          @click="startSync"
        >
          <template #icon>
            <n-icon> <Play /> </n-icon>
          </template>
          {{ $t('views.fileSync.startSync') }}
        </n-button>
        <n-button @click="openWhiteListModal">
          <template #icon>
            <n-icon> <List /> </n-icon>
          </template>
          {{ $t('views.fileSync.folderWhiteList') + ` ${folderWhiteList.length}` }}
        </n-button>

        <div style="margin-left: auto">
          {{ syncProgressTxt }}
        </div>
      </n-flex>

      <div class="table-wrapper">
        <DiffDataTable></DiffDataTable>
      </div>
    </div>
    <FolderWhiteListModal></FolderWhiteListModal>
    <FtpConfigModal></FtpConfigModal>
  </div>
</template>

<style lang="less" scoped>
.file-sync {
  padding: 18px;
  height: calc(100vh - 69px);

  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;

    .table-wrapper {
      flex: 1;
      overflow: hidden;
    }
  }
}
</style>
