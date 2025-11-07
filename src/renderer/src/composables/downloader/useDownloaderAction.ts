import { useDiscreteApi } from '../discrete-api/useDiscreteApi'
import { i18n } from '@renderer/locales'
import { useAria2 } from './useAria2'
import { useTaskList } from './useTaskList'
import { computed, ref } from 'vue'

const { t } = i18n.global
const { confirm, message } = useDiscreteApi()

const { aria2 } = useAria2()
const { checkedRowKeys, checkedTasks } = useTaskList()

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

async function startTasks() {
  if (!toStartTasks.value.length) {
    message.info(t('views.downloader.noTaskToStart'))
    return
  }
  try {
    startLoading.value = true
    await Promise.all(toStartTasks.value.map((task) => aria2.value?.unpause(task.gid)))
    message.success(t('views.downloader.startSuccess'))
  } catch {
    message.error(t('views.downloader.startFailed'))
  } finally {
    startLoading.value = false
    checkedRowKeys.value = []
  }
}

async function pauseTasks() {
  if (!toPauseTasks.value.length) {
    message.info(t('views.downloader.noTaskToPause'))
    return
  }
  try {
    pauseLoading.value = true
    await Promise.all(toPauseTasks.value.map((task) => aria2.value?.pause(task.gid)))
    message.success(t('views.downloader.pauseSuccess'))
  } catch {
    message.error(t('views.downloader.pauseFailed'))
  } finally {
    pauseLoading.value = false
    checkedRowKeys.value = []
  }
}

async function stopTasks() {
  if (!toStopTasks.value.length) {
    message.info(t('views.downloader.noTaskToStop'))
    return
  }

  await confirm('warning', {
    title: t('common.warning'),
    content: t('views.downloader.stopConfirm'),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
  })

  try {
    stopLoading.value = true
    await Promise.all(toStopTasks.value.map((task) => aria2.value?.remove(task.gid)))
    message.success(t('views.downloader.stopSuccess'))
  } catch {
    message.error(t('views.downloader.stopFailed'))
  } finally {
    stopLoading.value = false
    checkedRowKeys.value = []
  }
}

async function removeTasks() {
  if (!toRemoveTasks.value.length) {
    message.info(t('views.downloader.noTaskToRemove'))
    return
  }

  await confirm('warning', {
    title: t('common.warning'),
    content: t('views.downloader.removeConfirm'),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
  })

  try {
    removeLoading.value = true
    await Promise.all(
      toRemoveTasks.value.map((task) => aria2.value?.removeDownloadResult(task.gid)),
    )
    message.success(t('views.downloader.removeSuccess'))
  } catch {
    message.error(t('views.downloader.removeFailed'))
  } finally {
    removeLoading.value = false
    checkedRowKeys.value = []
  }
}

export function useDownloaderActions() {
  return {
    startLoading,
    pauseLoading,
    stopLoading,
    removeLoading,
    startTasks,
    pauseTasks,
    stopTasks,
    removeTasks,
  }
}
