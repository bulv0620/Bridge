import { useDiffList } from './useDiffList'
import { useSyncForm } from './useSyncForm'
import { EDiffAction, EDiffStatus, useSyncTool } from './useSyncTool'
import { useFolderWhiteList } from './useFolderWhiteList'
import { FtpFileSystem } from '@renderer/utils/file-system'
import { formatTimeDifference } from '@renderer/utils/format'
import { computed, ref } from 'vue'
import { i18n } from '@renderer/locales'
import { useDiscreteApi } from '../discrete-api/useDiscreteApi'

const { dialog, message, confirm } = useDiscreteApi()
const { t } = i18n.global

const { sourceFolder, targetFolder } = useSyncForm()
const { diffTableData, hasWaitingFile, scrollTo, clearTypeFilter } = useDiffList()
const { folderWhiteList } = useFolderWhiteList()
const { syncFile, getFileSystemInstance } = useSyncTool()

const pauseFlag = ref(false)
const percentage = ref(0)

const syncProgressTxt = computed(
  () =>
    `${diffTableData.value.filter((row) => row.status !== EDiffStatus.waiting).length}/${diffTableData.value.length}`,
)

const processing = computed(function () {
  return diffTableData.value.some(function (diffFile) {
    return diffFile.status === EDiffStatus.processing
  })
})

let startTime = 0 //同步开始时间戳（毫秒）
let totalTime = 0 //累计同步用时（毫秒）
let successCount = 0 //同步成功的文件数
let errorCount = 0 // 同步失败的文件数

async function startSync() {
  if (!hasWaitingFile.value) return

  // 首次同步弹窗确认
  if (
    diffTableData.value.every(function (el) {
      return el.status === EDiffStatus.waiting
    })
  ) {
    await confirm('info', {
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
    await confirm('warning', {
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
  clearTypeFilter()

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
    scrollTo(i)

    const processingItem = diffTableData.value[i]
    processingItem.status = EDiffStatus.processing

    try {
      if (processingItem.action === EDiffAction.conflict) {
        throw new Error(t('views.fileSync.syncConflict'))
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
 * 暂停同步操作
 */
async function pauseSync() {
  pauseFlag.value = true
}

export function useFileSync() {
  return { syncProgressTxt, processing, pauseFlag, percentage, startSync, pauseSync }
}
