import { Aria2Client } from '@renderer/utils/aria2/request'
import { Aria2GlobalStat, Aria2Status } from '@renderer/utils/aria2/aria2-types'
import { ref } from 'vue'

const isConnected = ref(false)
const aria2 = ref<Aria2Client | null>(null)

const activeTasks = ref<Aria2Status[]>([])
const waitingTasks = ref<Aria2Status[]>([])
const stoppedTasks = ref<Aria2Status[]>([])
const globalStats = ref<Aria2GlobalStat | null>(null)

let timer: ReturnType<typeof setInterval> | null = null

async function testConnection() {
  if (aria2.value) {
    const flag = await aria2.value.testConnection()
    isConnected.value = flag
    if (!flag) throw new Error('Failed to connect to Aria2')
  } else {
    throw new Error('Aria2 client is not initialized')
  }
}

async function fetchStats() {
  if (!aria2.value) return

  try {
    const keys = ['gid', 'totalLength', 'completedLength', 'downloadSpeed', 'status', 'files']

    const [active, waiting, stopped, stats] = await Promise.all([
      aria2.value.tellActive(keys),
      aria2.value.tellWaiting(0, 100, keys), // 可根据需要增加数量上限
      aria2.value.tellStopped(0, 100, keys),
      aria2.value.getGlobalStat(),
    ])

    activeTasks.value = active
    waitingTasks.value = waiting
    stoppedTasks.value = stopped
    globalStats.value = stats
  } catch (error) {
    isConnected.value = false
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

export function useAria2() {
  return {
    aria2,
    isConnected,
    activeTasks,
    waitingTasks,
    stoppedTasks,
    globalStats,
    testConnection,
    fetchStats,
    startPolling,
    stopPolling,
  }
}
