<script setup lang="ts">
import { SwapHorizontal, FileTrayFull, SaveOutline, Pause, Play } from '@vicons/ionicons5'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
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
import { NIcon } from 'naive-ui'
import DiffDataTable from './components/diff-data-table/DiffDataTable.vue'

enum ESyncType {
  mirror = 'mirror',
  twoWay = 'two-way',
  increment = 'increment',
}

const crypto = window.api.crypto
const { t } = useI18n()

const loading = ref(false)
const percentage = ref(0)
const sourceFolder = ref<FolderInfo>({
  type: '',
  path: '',
})
const targetFolder = ref<FolderInfo>({
  type: '',
  path: '',
})
const diffTableData = ref<DiffFile[]>([])
const tableRef = ref<any>()

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

watch(syncType, (type) => {
  diffTableData.value.forEach((diffFile) => {
    diffFile.action = getDiffAction(diffFile, type)
  })
})

watch(sourceFolder, () => {
  diffTableData.value = []
})

watch(targetFolder, () => {
  diffTableData.value = []
})

const getDiffAction = (diffFile: DiffFile, syncType: ESyncType): EDiffAction => {
  switch (syncType) {
    case ESyncType.mirror:
      // 镜像模式下，无论 diffFile.diffType 为何均同步为右侧
      return EDiffAction.toRight

    case ESyncType.twoWay:
      // 双向同步，根据 diffFile.diffType 决定方向
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
      // 增量同步
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

const handleDiffClick = async () => {
  percentage.value = 0
  diffTableData.value = []
  try {
    loading.value = true

    if (!sourceFolder.value.path || !targetFolder.value.path) {
      return
    }

    const source = getFileSystemInstance(sourceFolder.value)
    const target = getFileSystemInstance(targetFolder.value)

    const sourceFiles = await source.getAllFiles()
    const targetFiles = await target.getAllFiles()

    const diff = diffFileListsUnified(sourceFiles, targetFiles)

    diffTableData.value = diff.map((diffFile) => ({
      key: crypto.randomUUID(),
      ...diffFile,
      action: getDiffAction(diffFile, syncType.value),
      status: EDiffStatus.waiting,
    }))

    if (source instanceof FtpFileSystem) {
      source.disconnect()
    }
    if (target instanceof FtpFileSystem) {
      target.disconnect()
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleStartSync = async () => {
  if (!hasWaitingFile.value) return

  const startIndex = diffTableData.value.findIndex((el) => el.status === EDiffStatus.waiting)

  percentage.value = (startIndex / diffTableData.value.length) * 100
  for (let i = startIndex; i < diffTableData.value.length; i++) {
    if (pauseFlag.value) {
      pauseFlag.value = false
      return
    }
    tableRef.value?.scrollTo(51.8 * i) // 滚动到指定位置

    const processingItem = diffTableData.value[i]
    processingItem.status = EDiffStatus.processing

    try {
      const source = getFileSystemInstance(sourceFolder.value)
      const target = getFileSystemInstance(targetFolder.value)

      await syncFile(processingItem, source, target)

      diffTableData.value[i].status = EDiffStatus.success
    } catch (error) {
      diffTableData.value[i].status = EDiffStatus.error
    } finally {
      percentage.value = ((i + 1) / diffTableData.value.length) * 100
    }
  }
}

const handlePauseSync = async () => {
  pauseFlag.value = true
}
</script>

<template>
  <div class="backpack-sync">
    <div class="container">
      <!-- 方案栏 -->
      <n-flex justify="space-between">
        <p class="title">
          <span>{{ $t('views.backpack.newPlan') }}</span>
        </p>
        <n-button strong secondary circle :disabled="processing">
          <template #icon>
            <n-icon> <FileTrayFull /> </n-icon>
          </template>
        </n-button>
      </n-flex>

      <!-- 目录选择栏 -->
      <n-flex :wrap="false">
        <FolderSelectionInput
          v-model:value="sourceFolder"
          type="source"
          :processing="processing"
        ></FolderSelectionInput>
        <n-button
          strong
          circle
          :disabled="!sourceFolder.path || !targetFolder.path || processing"
          :loading="loading"
          @click="handleDiffClick"
        >
          <template #icon>
            <n-icon> <SwapHorizontal /> </n-icon>
          </template>
        </n-button>
        <FolderSelectionInput
          v-model:value="targetFolder"
          type="target"
          :processing="processing"
        ></FolderSelectionInput>
      </n-flex>

      <!-- 同步操作栏 -->
      <n-flex :wrap="false">
        <n-select v-model:value="syncType" :options="syncOptions" style="width: 180px" />
        <n-button v-if="processing" type="warning" :loading="pauseFlag" @click="handlePauseSync">
          <template #icon>
            <n-icon> <Pause /> </n-icon>
          </template>
          {{ $t('views.backpack.startSync') }}
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
        <n-button :disabled="!sourceFolder.path || !targetFolder.path">
          <template #icon>
            <n-icon> <SaveOutline /> </n-icon>
          </template>
          {{ $t('views.backpack.savePlan') }}
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
