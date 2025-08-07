import { ref, computed } from 'vue'
import { useAria2 } from '@renderer/composables/downloader/useAria2'

const { aria2, isConnected, globalStats, checkedRowKeys, checkedTasks } = useAria2()

const startLoading = ref(false)
const pauseLoading = ref(false)
const stopLoading = ref(false)
const removeLoading = ref(false)

// 选中任务按状态分类过滤，方便调用
const toStartTasks = computed(() =>
  checkedTasks.value.filter((t) => t.status === 'paused' || t.status === 'waiting'),
)
const toPauseTasks = computed(() => checkedTasks.value.filter((t) => t.status === 'active'))
const toStopTasks = computed(() => {
  const activeStates = ['active', 'waiting', 'paused']
  return checkedTasks.value.filter((t) => activeStates.includes(t.status))
})
const toRemoveTasks = computed(() => {
  const removableStates = ['complete', 'error', 'removed']
  return checkedTasks.value.filter((t) => removableStates.includes(t.status))
})

export function useDownloader() {
  return {
    aria2,
    isConnected,
    globalStats,
    checkedRowKeys,
    checkedTasks,
    startLoading,
    pauseLoading,
    stopLoading,
    removeLoading,
    toStartTasks,
    toPauseTasks,
    toStopTasks,
    toRemoveTasks,
  }
}
