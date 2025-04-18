<script setup lang="ts">
// #region imports
import { SwapHorizontal, FileTrayFull, List, Pause, Play, Document, Save } from '@vicons/ionicons5'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import FolderWhiteListModal from './components/folder-white-list-modal/FolderWhiteListModal.vue'
import FolderSelectionInput from './components/folder-selection-input/FolderSelectionInput.vue'
import type { FolderInfo } from './components/folder-selection-input/FolderSelectionInput.vue'
import {
  DiffFile,
  diffFileListsUnified,
  EDiffAction,
  EDiffStatus,
  EDiffType,
  FtpFileSystem,
  getFileSystemInstance,
  syncFile,
} from '@renderer/utils/file-system'
import { NIcon, useDialog, useMessage } from 'naive-ui'
import DiffDataTable from './components/diff-data-table/DiffDataTable.vue'
import { dialogPromise } from '@renderer/utils/dialog'
// #endregion

// #region options
defineOptions({
  name: 'BackpackSync',
})
// #endregion

// #region enums
enum ESyncType {
  mirror = 'mirror',
  twoWay = 'two-way',
  increment = 'increment',
}
// #endregion

// #region global states
const message = useMessage()
const dialog = useDialog()
const crypto = window.api.crypto
const { t } = useI18n()

const loading = ref(false)
const percentage = ref(0)
const sourceFolder = ref<FolderInfo>({ type: '', path: '' })
const targetFolder = ref<FolderInfo>({ type: '', path: '' })
const diffTableData = ref<DiffFile[]>([])
const tableRef = ref<any>()
const folderWhiteList = ref<string[]>([])
const folderWhiteListModalRef = ref<InstanceType<typeof FolderWhiteListModal> | null>(null)

const syncOptions = computed(() => [
  { label: t('views.backpack.mirrorSync'), value: ESyncType.mirror },
  { label: t('views.backpack.twoWaySync'), value: ESyncType.twoWay },
  { label: t('views.backpack.incrementalSync'), value: ESyncType.increment },
])
const syncType = ref(ESyncType.mirror)
const pauseFlag = ref(false)

const processing = computed(() => {
  return diffTableData.value.some((diffFile) => diffFile.status === EDiffStatus.processing)
})
const hasWaitingFile = computed(() => {
  return diffTableData.value.some((diffFile) => diffFile.status === EDiffStatus.waiting)
})
// #endregion

// #region watchers
watch(syncType, (type) => {
  diffTableData.value.forEach((diffFile) => {
    diffFile.action = getDiffAction(diffFile, type)
  })
})
watch(
  sourceFolder,
  () => {
    diffTableData.value = []
  },
  { deep: true },
)
watch(
  targetFolder,
  () => {
    diffTableData.value = []
  },
  { deep: true },
)
// #endregion

// #region helpers
const getDiffAction = (diffFile: DiffFile, syncType: ESyncType): EDiffAction => {
  switch (syncType) {
    case ESyncType.mirror:
      return EDiffAction.toRight
    case ESyncType.twoWay:
      switch (diffFile.diffType) {
        case EDiffType.onlySource:
          return EDiffAction.toRight
        case EDiffType.onlyTarget:
          return EDiffAction.toLeft
        case EDiffType.conflict:
          return EDiffAction.conflict
        default:
          throw new Error(`未处理的 diffType:${diffFile.diffType}`)
      }
    case ESyncType.increment:
      switch (diffFile.diffType) {
        case EDiffType.onlySource:
          return EDiffAction.toRight
        case EDiffType.onlyTarget:
          return EDiffAction.ignore
        case EDiffType.conflict:
          return EDiffAction.toRight
        default:
          throw new Error(`未处理的 diffType:${diffFile.diffType}`)
      }
    default:
      throw new Error(`未处理的 syncType:${syncType}`)
  }
}
// #endregion

// #region handlers
const handleSetFolderWhiteList = async () => {
  const res = await folderWhiteListModalRef.value?.select(folderWhiteList.value)
  if (res) {
    folderWhiteList.value = res
  }
}

const handleDiffClick = async () => {
  percentage.value = 0
  diffTableData.value = []
  try {
    loading.value = true

    if (!sourceFolder.value.path || !targetFolder.value.path) return

    const source = getFileSystemInstance(sourceFolder.value, folderWhiteList.value)
    const target = getFileSystemInstance(targetFolder.value, folderWhiteList.value)

    const sourceValid = await source.validate()
    if (!sourceValid) {
      message.error(t('views.backpack.sourceInvalid'))
      return
    }
    const targetValid = await target.validate()
    if (!targetValid) {
      message.error(t('views.backpack.targetInvalid'))
      return
    }

    const sourceFiles = await source.getAllFiles()
    const targetFiles = await target.getAllFiles()

    const diff = diffFileListsUnified(sourceFiles, targetFiles)

    diffTableData.value = diff.map((diffFile) => ({
      key: crypto.randomUUID(),
      ...diffFile,
      action: getDiffAction(diffFile, syncType.value),
      status: EDiffStatus.waiting,
    }))

    if (source instanceof FtpFileSystem) source.disconnect()
    if (target instanceof FtpFileSystem) target.disconnect()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

let startTime = 0
let totalTime = 0
let successCount = 0
let errorCount = 0
const handleStartSync = async () => {
  if (!hasWaitingFile.value) return

  await dialogPromise(dialog.info, {
    title: t('common.info'),
    content: t('views.backpack.syncConfirm'),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
  })

  if (diffTableData.value.some((el) => el.action === EDiffAction.conflict)) {
    await dialogPromise(dialog.warning, {
      title: t('common.warning'),
      content: t('views.backpack.syncConflictContent'),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
    })
  }

  const startIndex = diffTableData.value.findIndex((el) => el.status === EDiffStatus.waiting)
  percentage.value = (startIndex / diffTableData.value.length) * 100
  tableRef.value?.clearFilter()

  const source = getFileSystemInstance(sourceFolder.value, folderWhiteList.value)
  const target = getFileSystemInstance(targetFolder.value, folderWhiteList.value)

  const sourceValid = await source.validate()
  if (!sourceValid) {
    message.error(t('views.backpack.sourceInvalid'))
    return
  }
  const targetValid = await target.validate()
  if (!targetValid) {
    message.error(t('views.backpack.targetInvalid'))
    return
  }

  startTime = new Date().getTime()
  for (let i = startIndex; i < diffTableData.value.length; i++) {
    if (pauseFlag.value) {
      pauseFlag.value = false
      startTime = 0
      totalTime += new Date().getTime() - startTime
      return
    }
    tableRef.value?.scrollTo(i)

    const processingItem = diffTableData.value[i]
    processingItem.status = EDiffStatus.processing

    try {
      if (processingItem.action === EDiffAction.conflict) {
        throw new Error(t('views.backpack.syncConflict'))
      }
      await syncFile(processingItem, source, target)

      diffTableData.value[i].status = EDiffStatus.success
      successCount++
    } catch (error) {
      diffTableData.value[i].status = EDiffStatus.error
      processingItem.error = error as Error
      errorCount++
    } finally {
      percentage.value = ((i + 1) / diffTableData.value.length) * 100
    }
  }

  if (source instanceof FtpFileSystem) source.disconnect()
  if (target instanceof FtpFileSystem) target.disconnect()

  totalTime += new Date().getTime() - startTime

  dialog.success({
    title: t('common.success'),
    content: t('views.backpack.syncSummary', {
      time: formatTimeDifference(totalTime),
      success: successCount,
      failure: errorCount,
    }),
    positiveText: t('common.confirm'),
  })

  // 清空状态记录
  startTime = 0
  totalTime = 0
  successCount = 0
  errorCount = 0
}

const formatTimeDifference = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

const handlePauseSync = async () => {
  pauseFlag.value = true
}
// #endregion
</script>

<template>
  <div class="backpack-sync">
    <div class="container">
      <!-- 方案栏 -->
      <n-flex justify="space-between">
        <p class="title">
          <span>{{ $t('views.backpack.newPlan') }}</span>
        </p>
        <n-flex>
          <n-button circle :disabled="processing">
            <template #icon>
              <n-icon> <Document /> </n-icon>
            </template>
          </n-button>
          <n-button circle :disabled="processing">
            <template #icon>
              <n-icon> <Save /> </n-icon>
            </template>
          </n-button>
          <n-button circle :disabled="processing">
            <template #icon>
              <n-icon> <FileTrayFull /> </n-icon>
            </template>
          </n-button>
        </n-flex>
      </n-flex>

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
              @click="handleDiffClick"
            >
              <template #icon>
                <n-icon> <SwapHorizontal /> </n-icon>
              </template>
            </n-button>
          </template>
          <span>{{ $t('views.backpack.contrast') }}</span>
        </n-popover>

        <FolderSelectionInput
          v-model:value="targetFolder"
          type="target"
          :processing="processing"
        ></FolderSelectionInput>
      </n-flex>

      <!-- 同步操作栏 -->
      <n-flex :wrap="false">
        <n-select
          v-model:value="syncType"
          :options="syncOptions"
          style="width: 180px"
          :disabled="processing"
        />
        <n-button v-if="processing" type="warning" :loading="pauseFlag" @click="handlePauseSync">
          <template #icon>
            <n-icon> <Pause /> </n-icon>
          </template>
          {{ $t('views.backpack.stopSync') }}
        </n-button>
        <n-button
          v-else
          :disabled="diffTableData.length === 0 || !hasWaitingFile"
          :loading="loading"
          @click="handleStartSync"
        >
          <template #icon>
            <n-icon> <Play /> </n-icon>
          </template>
          {{ $t('views.backpack.startSync') }}
        </n-button>
        <n-button @click="handleSetFolderWhiteList">
          <template #icon>
            <n-icon> <List /> </n-icon>
          </template>
          {{ $t('views.backpack.folderWhiteList') + ` ${folderWhiteList.length}` }}
        </n-button>
      </n-flex>

      <!-- 进度条 -->
      <n-progress :processing="loading" status="success" type="line" :percentage="percentage">
        {{
          `${diffTableData.filter((row) => row.status !== EDiffStatus.waiting).length}/${diffTableData.length}`
        }}
      </n-progress>

      <!-- 表格 -->
      <div class="table-wrapper">
        <DiffDataTable
          ref="tableRef"
          v-model:data="diffTableData"
          :processing="processing"
          :loading="loading"
        ></DiffDataTable>
      </div>
    </div>
    <FolderWhiteListModal ref="folderWhiteListModalRef"></FolderWhiteListModal>
  </div>
</template>

<style lang="less" scoped>
.backpack-sync {
  padding: 18px;
  height: calc(100vh - 69px);

  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;

    .title {
      height: 100%;
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: large;
      font-weight: 400;
    }

    .table-wrapper {
      flex: 1;
      overflow: hidden;
    }
  }
}
</style>
