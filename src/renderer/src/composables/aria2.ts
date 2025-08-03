import { Aria2Client } from '@renderer/utils/aria2/request'
import { Aria2GlobalStat, Aria2Status } from '@renderer/utils/aria2/aria2-types'
import { ref } from 'vue'

const isConnected = ref(false)
const aria2 = ref<Aria2Client | null>(null)

const activeTasks = ref<Aria2Status[]>([])
const globalStats = ref<Aria2GlobalStat | null>(null)
let timer: ReturnType<typeof setInterval> | null = null

async function testConnection() {
  if (aria2.value) {
    const flag = await aria2.value.testConnection()
    if (flag) {
      isConnected.value = true
      return
    }
    isConnected.value = false
    throw new Error('Failed to connect to Aria2')
  } else {
    throw new Error('Aria2 client is not initialized')
  }
}

async function fetchStats() {
  if (!aria2.value) return
  try {
    const active = await aria2.value.tellActive([
      'gid',
      'totalLength',
      'completedLength',
      'downloadSpeed',
      'status',
      'files',
    ])
    const stats = await aria2.value.getGlobalStat()
    activeTasks.value = active
    globalStats.value = stats

    console.log(stats, active)
  } catch (error) {
    isConnected.value = false
    console.warn('[Aria2Polling] Error while polling:', error)
  }
}

const startPolling = (interval: number) => {
  if (timer || !aria2.value) return
  timer = setInterval(fetchStats, interval)
  fetchStats()
}

const stopPolling = () => {
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
    globalStats,
    testConnection,
    fetchStats,
    startPolling,
    stopPolling,
  }
}
