import { useDiscreteApi } from '../discrete-api/useDiscreteApi'
import { i18n } from '@renderer/locales'
import { useAria2 } from './useAria2'
import { useTaskList } from './useTaskList'
import { ref } from 'vue'

const { t } = i18n.global
const { confirm, message } = useDiscreteApi()

const { aria2 } = useAria2()
const { getCheckedRows, clearCheckedRows } = useTaskList()

const startLoading = ref(false)
const pauseLoading = ref(false)
const stopLoading = ref(false)
const removeLoading = ref(false)

function getTasks(type: 'to-start' | 'to-pause' | 'to-stop' | 'to-remove') {
  const checkedRows = getCheckedRows()
  if (checkedRows.length === 0) {
    message.info(t('views.downloader.noSelectedRows'))
    return
  }

  if (type === 'to-start') {
    return checkedRows.filter((t) => t.status === 'paused' || t.status === 'waiting')
  } else if (type === 'to-pause') {
    return checkedRows.filter((t) => t.status === 'active')
  } else if (type === 'to-stop') {
    const activeStates = ['active', 'waiting', 'paused']
    return checkedRows.filter((t) => activeStates.includes(t.status))
  } else if (type === 'to-remove') {
    const removableStates = ['complete', 'error', 'removed']
    return checkedRows.filter((t) => removableStates.includes(t.status))
  }

  return []
}

async function startTasks() {
  const toStartTasks = getTasks('to-start')
  if (!toStartTasks) return
  if (!toStartTasks.length) {
    message.info(t('views.downloader.noTaskToStart'))
    return
  }
  try {
    startLoading.value = true
    await Promise.all(toStartTasks.map((task) => aria2.value?.unpause(task.gid)))
    message.success(t('views.downloader.startSuccess'))
  } catch {
    message.error(t('views.downloader.startFailed'))
  } finally {
    startLoading.value = false
    clearCheckedRows()
  }
}

async function pauseTasks() {
  const toPauseTasks = getTasks('to-pause')
  if (!toPauseTasks) return
  if (!toPauseTasks.length) {
    message.info(t('views.downloader.noTaskToPause'))
    return
  }
  try {
    pauseLoading.value = true
    await Promise.all(toPauseTasks.map((task) => aria2.value?.pause(task.gid)))
    message.success(t('views.downloader.pauseSuccess'))
  } catch {
    message.error(t('views.downloader.pauseFailed'))
  } finally {
    pauseLoading.value = false
    clearCheckedRows()
  }
}

async function stopTasks() {
  const toStopTasks = getTasks('to-stop')
  if (!toStopTasks) return
  if (!toStopTasks.length) {
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
    await Promise.all(toStopTasks.map((task) => aria2.value?.remove(task.gid)))
    message.success(t('views.downloader.stopSuccess'))
  } catch {
    message.error(t('views.downloader.stopFailed'))
  } finally {
    stopLoading.value = false
    clearCheckedRows()
  }
}

async function removeTasks() {
  const toRemoveTasks = getTasks('to-remove')
  if (!toRemoveTasks) return
  if (!toRemoveTasks.length) {
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
    await Promise.all(toRemoveTasks.map((task) => aria2.value?.removeDownloadResult(task.gid)))
    message.success(t('views.downloader.removeSuccess'))
  } catch {
    message.error(t('views.downloader.removeFailed'))
  } finally {
    removeLoading.value = false
    clearCheckedRows()
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
