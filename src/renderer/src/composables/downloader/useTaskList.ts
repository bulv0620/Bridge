import { computed, ref } from 'vue'
import { useAria2 } from './useAria2'
import { Aria2GlobalStat, Aria2Status } from '@renderer/utils/aria2/Aria2Types'
import { i18n } from '@renderer/locales'
import {
  getTaskPercentage,
  getTaskSize,
  getTaskSpeed,
  getTaskStatus,
  getTaskTimeLeft,
} from '@renderer/utils/get-task-info'
import { VxeTable } from 'vxe-table'

export interface DownloadTaskInfo {
  gid: string
  name: string
  status: DownloadTaskStatus
  progress: number
  size: string
  speed: string
  eta: string
  origin: any
}

export interface DownloadTaskStatus {
  type: string
  label: string
}

const { t } = i18n.global
const { aria2 } = useAria2()

const activeTaskListTab = ref('all')

const taskListTabOptions = computed(() => [
  { key: 'all', label: t('views.downloader.all') },
  { key: 'downloading', label: t('views.downloader.downloading') },
  { key: 'waiting', label: t('views.downloader.waiting') },
  { key: 'completed', label: t('views.downloader.completed') },
])

const activeTasks = ref<Aria2Status[]>([])
const waitingTasks = ref<Aria2Status[]>([])
const stoppedTasks = ref<Aria2Status[]>([])
const globalStats = ref<Aria2GlobalStat | null>(null)

const allTasks = computed(() => {
  return [...activeTasks.value, ...waitingTasks.value, ...stoppedTasks.value]
})

const tableRef = ref<InstanceType<typeof VxeTable> | null>(null)
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
    gid: task.gid,
    name: `[${task.files?.length || 0}] ${task.files?.[0]?.path?.split('/').pop() || t('views.downloader.unknown')}`,
    status: getTaskStatus(task),
    progress: getTaskPercentage(task),
    size: getTaskSize(task),
    speed: getTaskSpeed(task),
    eta: getTaskTimeLeft(task),
    origin: task,
  }))
})

let timer: ReturnType<typeof setInterval> | null = null

function getCheckedRows() {
  const set = new Set(tableRef.value?.getCheckboxRecords().map((row) => row.gid))

  return allTasks.value.filter((task) => set.has(task.gid))
}

function clearCheckedRows() {
  tableRef.value?.clearCheckboxRow()
}

async function fetchStats() {
  if (!aria2.value) return

  try {
    const keys = [
      'gid',
      'totalLength',
      'completedLength',
      'downloadSpeed',
      'status',
      'files',
      'seeder',
    ]

    const [active, waiting, stopped, stats] = await Promise.all([
      aria2.value.tellActive(keys),
      aria2.value.tellWaiting(0, 100, keys), // 可根据需要增加数量上限
      aria2.value.tellStopped(0, 100, keys),
      aria2.value.getGlobalStat(),
    ])

    activeTasks.value = active
    waitingTasks.value = waiting
    stoppedTasks.value = stopped.reverse()
    globalStats.value = stats
  } catch (error) {
    console.warn('[Aria2Polling] Error while polling:', error)
  }
}

function startPolling(interval: number) {
  if (timer || !aria2.value) return
  timer = setInterval(fetchStats, interval)
  fetchStats()
}

function stopPolling() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

export function useTaskList() {
  return {
    activeTaskListTab,
    taskListTabOptions,
    tableData,
    tableRef,
    activeTasks,
    waitingTasks,
    stoppedTasks,
    allTasks,
    globalStats,
    fetchStats,
    startPolling,
    stopPolling,
    getCheckedRows,
    clearCheckedRows,
  }
}
