<script setup lang="ts">
import { SwapHorizontal, FileTrayFull, SaveOutline, Pause, Play } from '@vicons/ionicons5'
import { computed, onActivated, onDeactivated, ref, watch } from 'vue'
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
import { NIcon, useDialog } from 'naive-ui'
import DiffDataTable from './components/diff-data-table/DiffDataTable.vue'
import { dialogPromise } from '@renderer/utils/dialog'

defineOptions({
  name: 'BackpackSync',
})
onActivated(() => {
  console.log('Setting activated')
})
onDeactivated(() => {
  console.log('Setting deactivated')
})
enum ESyncType {
  mirror = 'mirror',
  twoWay = 'two-way',
  increment = 'increment',
}

const dialog = useDialog()
const crypto = window.api.crypto
const { t } = useI18n()

const loading = ref(false) // 是否正在加载
const percentage = ref(0) // 进度条百分比
const sourceFolder = ref<FolderInfo>({
  type: '',
  path: '',
}) // 源文件夹
const targetFolder = ref<FolderInfo>({
  type: '',
  path: '',
}) // 目标文件夹
const diffTableData = ref<DiffFile[]>([]) // 差异文件列表
const tableRef = ref<any>() // 表格引用

const syncOptions = computed(() => [
  { label: t('views.backpack.mirrorSync'), value: ESyncType.mirror },
  { label: t('views.backpack.twoWaySync'), value: ESyncType.twoWay },
  { label: t('views.backpack.incrementalSync'), value: ESyncType.increment },
]) // 同步方式选项
const syncType = ref(ESyncType.mirror) // 同步方式
const pauseFlag = ref(false) // 暂停标志

const processing = computed(() => {
  return diffTableData.value.some((diffFile) => diffFile.status === EDiffStatus.processing)
}) // 是否有正在处理的文件

const hasWaitingFile = computed(() => {
  return diffTableData.value.some((diffFile) => diffFile.status === EDiffStatus.waiting)
}) // 是否有等待处理的文件

// 监听同步类型的变化更改默认操作
watch(syncType, (type) => {
  diffTableData.value.forEach((diffFile) => {
    diffFile.action = getDiffAction(diffFile, type)
  })
})

// 监听源文件夹的变化，清空 diffTableData
watch(sourceFolder, () => {
  diffTableData.value = []
})

// 监听目标文件夹的变化，清空 diffTableData
watch(targetFolder, () => {
  diffTableData.value = []
})

// 获取 diffFile 的默认操作
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

// 开始对比
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

// const wait = (ms: number) => {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve(true)
//     }, ms)
//   })
// }

// 开始同步
const handleStartSync = async () => {
  if (!hasWaitingFile.value) return
  if (diffTableData.value.some((el) => el.action === EDiffAction.conflict)) {
    await dialogPromise(dialog.warning, {
      title: t('common.warning'),
      content: t('views.backpack.syncConflictContent'),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
    })
  }

  // 找到起始位置
  const startIndex = diffTableData.value.findIndex((el) => el.status === EDiffStatus.waiting)
  percentage.value = (startIndex / diffTableData.value.length) * 100
  // 清除过滤
  tableRef.value?.clearFilter()

  const source = getFileSystemInstance(sourceFolder.value)
  const target = getFileSystemInstance(targetFolder.value)

  for (let i = startIndex; i < diffTableData.value.length; i++) {
    // 如果按下暂停，则结束
    if (pauseFlag.value) {
      pauseFlag.value = false
      return
    }
    tableRef.value?.scrollTo(51 * i) // 滚动到指定位置

    // 当前行
    const processingItem = diffTableData.value[i]
    processingItem.status = EDiffStatus.processing

    try {
      if (processingItem.action === EDiffAction.conflict) {
        throw new Error(t('views.backpack.syncConflict'))
      }
      await syncFile(processingItem, source, target)

      diffTableData.value[i].status = EDiffStatus.success
    } catch (error) {
      diffTableData.value[i].status = EDiffStatus.error
      processingItem.error = error as Error
    } finally {
      percentage.value = ((i + 1) / diffTableData.value.length) * 100
    }
  }

  if (source instanceof FtpFileSystem) {
    source.disconnect()
  }
  if (target instanceof FtpFileSystem) {
    target.disconnect()
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
        <n-popover
          trigger="hover"
          :delay="500"
          :disabled="!sourceFolder.path || !targetFolder.path || processing"
        >
          <template #trigger>
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
