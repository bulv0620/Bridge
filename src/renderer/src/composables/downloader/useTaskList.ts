import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAria2 } from './useAria2'
import { Aria2Status } from '@renderer/utils/aria2/Aria2Types'
import { formatBytes, formatBytesPerSecond, formatTimeLeft } from '@renderer/utils/format'

export interface DownloadTaskInfo {
  name: string
  status: DownloadTaskStatus
  progress: number
  size: string
  speed: string
  eta: string
}

export interface DownloadTaskStatus {
  type: string
  label: string
}

const activeTaskListTab = ref('downloading')

export function useTaskList() {
  const { t } = useI18n()
  const { activeTasks, waitingTasks, stoppedTasks, checkedRowKeys } = useAria2()

  const taskListTabOptions = computed(() => [
    { key: 'all', label: t('views.downloader.all') },
    { key: 'downloading', label: t('views.downloader.downloading') },
    { key: 'waiting', label: t('views.downloader.waiting') },
    { key: 'completed', label: t('views.downloader.completed') },
  ])

  const tableData = computed<DownloadTaskInfo[]>(() => {
    let taskList: Aria2Status[] = []
    if (activeTaskListTab.value === 'all') {
      taskList = [...activeTasks.value, ...waitingTasks.value, ...stoppedTasks.value]
    }
    if (activeTaskListTab.value === 'downloading') {
      taskList = activeTasks.value
    }
    if (activeTaskListTab.value === 'waiting') {
      taskList = waitingTasks.value
    }
    if (activeTaskListTab.value === 'completed') {
      taskList = stoppedTasks.value
    }

    return taskList.map((task) => ({
      name: `[${task.files?.length || 0}] ${task.files?.[0]?.path?.split('/').pop() || t('views.downloader.unknown')}`,
      status: getTaskStatus(task),
      progress: getTaskPercentage(task),
      size: getTaskSize(task),
      speed: getTaskSpeed(task),
      eta: getTaskTimeLeft(task),
    }))
  })

  function getTaskStatus(row: Aria2Status) {
    const statusMap = {
      active: { type: 'success', label: t('views.downloader.downloading') },
      waiting: { type: 'warning', label: t('views.downloader.waiting') },
      complete: { type: 'info', label: t('views.downloader.completed') },
      paused: { type: 'default', label: t('views.downloader.paused') },
      error: { type: 'error', label: t('views.downloader.error') },
      removed: { type: 'error', label: t('views.downloader.removed') },
      seeding: { type: 'success', label: t('views.downloader.seeding') },
    }
    let info: { type: string; label: string }
    if (
      row.status === 'active' &&
      Number(row.totalLength) > 0 &&
      row.completedLength === row.totalLength
    ) {
      info = statusMap['seeding']
    } else {
      info = statusMap[row.status] || { type: 'default', label: row.status }
    }

    return info
  }

  function getTaskPercentage(row: Aria2Status) {
    if (Number(row.totalLength) === 0) return 0
    return Math.floor((Number(row.completedLength) / Number(row.totalLength)) * 100)
  }

  function getTaskSize(row: Aria2Status) {
    return `${formatBytes(Number(row.completedLength))}/${formatBytes(Number(row.totalLength))}`
  }

  function getTaskSpeed(row: Aria2Status) {
    return formatBytesPerSecond(Number(row.downloadSpeed))
  }

  function getTaskTimeLeft(row: Aria2Status) {
    if (Number(row.downloadSpeed) === 0 || Number(row.totalLength) === 0) return '-'
    const remaining = Number(row.totalLength) - Number(row.completedLength)
    return formatTimeLeft(remaining / Number(row.downloadSpeed))
  }

  return {
    activeTaskListTab,
    taskListTabOptions,
    tableData,
    checkedRowKeys,
  }
}
