<script setup lang="ts">
// #region imports
import { SwapHorizontal, List, Pause, Play } from '@vicons/ionicons5'
import { computed, nextTick, ref, watch } from 'vue'
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
  ESyncType,
  FtpFileSystem,
  getFileSystemInstance,
  syncFile,
} from '@renderer/utils/file-system'
import { NIcon, useDialog, useMessage } from 'naive-ui'
import DiffDataTable from './components/diff-data-table/DiffDataTable.vue'
import { dialogPromise } from '@renderer/utils/dialog'
import PlanControl from './components/plan-control/PlanControl.vue'
// #endregion

// #region options
defineOptions({
  name: 'FileSync',
})
// #endregion

// #region global states
const message = useMessage() // 消息提示实例
const dialog = useDialog() // 对话框实例
const crypto = window.api.crypto // 全局 crypto API
const { t } = useI18n() // 国际化方法

/**
 * 是否处于加载中（如对比、同步等操作）
 */
const loading = ref(false)

/**
 * 同步进度百分比
 */
const percentage = ref(0)

/**
 * 当前同步方案名称
 */
const planName = ref(t('views.fileSync.newPlan'))

/**
 * 源文件夹信息
 */
const sourceFolder = ref<FolderInfo>({ type: '', path: '' })

/**
 * 目标文件夹信息
 */
const targetFolder = ref<FolderInfo>({ type: '', path: '' })

/**
 * 差异文件表格数据
 */
const diffTableData = ref<DiffFile[]>([])

/**
 * 差异表格组件引用
 */
const tableRef = ref<any>()

/**
 * 文件夹白名单（同步时忽略的文件夹路径）
 */
const folderWhiteList = ref<string[]>([])

/**
 * 文件夹白名单弹窗组件引用
 */
const folderWhiteListModalRef = ref<InstanceType<typeof FolderWhiteListModal> | null>(null)

/**
 * 当前同步类型（镜像/双向/增量）
 */
const syncType = ref(ESyncType.mirror)

/**
 * 是否暂停同步
 */
const pauseFlag = ref(false)

/**
 * 同步类型下拉选项
 */
const syncOptions = computed(function () {
  return [
    { label: t('views.fileSync.mirrorSync'), value: ESyncType.mirror },
    { label: t('views.fileSync.twoWaySync'), value: ESyncType.twoWay },
    { label: t('views.fileSync.incrementalSync'), value: ESyncType.increment },
  ]
})

/**
 * 是否有文件正在处理中
 */
const processing = computed(function () {
  return diffTableData.value.some(function (diffFile) {
    return diffFile.status === EDiffStatus.processing
  })
})

/**
 * 是否存在待同步的文件
 */
const hasWaitingFile = computed(function () {
  return diffTableData.value.some(function (diffFile) {
    return diffFile.status === EDiffStatus.waiting
  })
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
// #endregion

// #region helpers
/**
 * 根据同步类型和差异类型，返回对应的同步操作类型
 * @param diffFile 差异文件对象
 * @param syncType 同步类型
 * @returns 差异操作类型
 */
function getDiffAction(diffFile: DiffFile, syncType: ESyncType): EDiffAction {
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
/**
 * 打开文件夹白名单选择弹窗，并更新白名单
 */
async function handleSetFolderWhiteList() {
  const res = await folderWhiteListModalRef.value?.select(folderWhiteList.value)
  if (res) {
    folderWhiteList.value = res
  }
}

/**
 * 对比源目录和目标目录，生成差异文件列表
 */
async function handleDiffClick() {
  percentage.value = 0
  diffTableData.value = []
  try {
    loading.value = true

    if (!sourceFolder.value.path || !targetFolder.value.path) return

    const source = getFileSystemInstance(sourceFolder.value, folderWhiteList.value)
    const target = getFileSystemInstance(targetFolder.value, folderWhiteList.value)

    const sourceValid = await source.validate()
    if (!sourceValid) {
      message.error(t('views.fileSync.sourceInvalid'))
      return
    }
    const targetValid = await target.validate()
    if (!targetValid) {
      message.error(t('views.fileSync.targetInvalid'))
      return
    }

    const sourceFiles = await source.getAllFiles()
    const targetFiles = await target.getAllFiles()

    const diff = diffFileListsUnified(sourceFiles, targetFiles)

    diffTableData.value = diff.map(function (diffFile) {
      return {
        key: crypto.randomUUID(),
        ...diffFile,
        action: getDiffAction(diffFile, syncType.value),
        status: EDiffStatus.waiting,
      }
    })

    if (source instanceof FtpFileSystem) source.disconnect()
    if (target instanceof FtpFileSystem) target.disconnect()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

/**
 * 同步开始时间戳（毫秒）
 */
let startTime = 0
/**
 * 累计同步用时（毫秒）
 */
let totalTime = 0
/**
 * 同步成功的文件数
 */
let successCount = 0
/**
 * 同步失败的文件数
 */
let errorCount = 0
/**
 * 开始执行同步操作
 */
async function handleStartSync() {
  if (!hasWaitingFile.value) return

  // 首次同步弹窗确认
  if (
    diffTableData.value.every(function (el) {
      return el.status === EDiffStatus.waiting
    })
  ) {
    await dialogPromise(dialog.info, {
      title: t('common.info'),
      content: t('views.fileSync.syncConfirm'),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
    })
  }

  // 存在冲突弹窗警告
  if (
    diffTableData.value.some(function (el) {
      return el.action === EDiffAction.conflict
    })
  ) {
    await dialogPromise(dialog.warning, {
      title: t('common.warning'),
      content: t('views.fileSync.syncConflictContent'),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
    })
  }

  const startIndex = diffTableData.value.findIndex(function (el) {
    return el.status === EDiffStatus.waiting
  })
  percentage.value = (startIndex / diffTableData.value.length) * 100
  tableRef.value?.clearFilter()

  const source = getFileSystemInstance(sourceFolder.value, folderWhiteList.value)
  const target = getFileSystemInstance(targetFolder.value, folderWhiteList.value)

  const sourceValid = await source.validate()
  if (!sourceValid) {
    message.error(t('views.fileSync.sourceInvalid'))
    return
  }
  const targetValid = await target.validate()
  if (!targetValid) {
    message.error(t('views.fileSync.targetInvalid'))
    return
  }

  startTime = new Date().getTime()
  for (let i = startIndex; i < diffTableData.value.length; i++) {
    if (pauseFlag.value) {
      pauseFlag.value = false
      totalTime += new Date().getTime() - startTime
      startTime = 0
      return
    }
    tableRef.value?.scrollTo(i)

    const processingItem = diffTableData.value[i]
    processingItem.status = EDiffStatus.processing

    try {
      if (processingItem.action === EDiffAction.conflict) {
        throw new Error(t('views.fileSync.syncConflict'))
      }
      await syncFile(processingItem, source, target)
      await nextTick()

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
    content: t('views.fileSync.syncSummary', {
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

/**
 * 格式化时间差为 hh:mm:ss 字符串
 * @param ms 毫秒数
 * @returns 格式化后的字符串
 */
function formatTimeDifference(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  function pad(n: number) {
    return n.toString().padStart(2, '0')
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

/**
 * 暂停同步操作
 */
async function handlePauseSync() {
  pauseFlag.value = true
}
// #endregion
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
              @click="handleDiffClick"
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
          {{ $t('views.fileSync.stopSync') }}
        </n-button>
        <n-button
          v-else
          :disabled="diffTableData.length === 0 || !hasWaitingFile"
          @click="handleStartSync"
        >
          <template #icon>
            <n-icon> <Play /> </n-icon>
          </template>
          {{ $t('views.fileSync.startSync') }}
        </n-button>
        <n-button @click="handleSetFolderWhiteList">
          <template #icon>
            <n-icon> <List /> </n-icon>
          </template>
          {{ $t('views.fileSync.folderWhiteList') + ` ${folderWhiteList.length}` }}
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
