import { i18n } from '@renderer/locales'
import { useAria2 } from './useAria2'
import { useTaskList } from './useTaskList'
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const { t } = i18n.global

const { aria2 } = useAria2()
const { getCheckedRows, clearCheckedRows } = useTaskList()

const startLoading = ref(false)
const pauseLoading = ref(false)
const stopLoading = ref(false)
const removeLoading = ref(false)

function getTasks(type: 'to-start' | 'to-pause' | 'to-stop' | 'to-remove') {
  const checkedRows = getCheckedRows()
  if (checkedRows.length === 0) {
    ElMessage.info(t('views.downloader.noSelectedRows'))
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
    ElMessage.info(t('views.downloader.noTaskToStart'))
    return
  }
  try {
    startLoading.value = true
    await Promise.all(toStartTasks.map((task) => aria2.value?.unpause(task.gid)))
    ElMessage.success(t('views.downloader.startSuccess'))
  } catch {
    ElMessage.error(t('views.downloader.startFailed'))
  } finally {
    startLoading.value = false
    clearCheckedRows()
  }
}

async function pauseTasks() {
  const toPauseTasks = getTasks('to-pause')
  if (!toPauseTasks) return
  if (!toPauseTasks.length) {
    ElMessage.info(t('views.downloader.noTaskToPause'))
    return
  }
  try {
    pauseLoading.value = true
    await Promise.all(toPauseTasks.map((task) => aria2.value?.pause(task.gid)))
    ElMessage.success(t('views.downloader.pauseSuccess'))
  } catch {
    ElMessage.error(t('views.downloader.pauseFailed'))
  } finally {
    pauseLoading.value = false
    clearCheckedRows()
  }
}

async function stopTasks() {
  const toStopTasks = getTasks('to-stop')
  if (!toStopTasks) return
  if (!toStopTasks.length) {
    ElMessage.info(t('views.downloader.noTaskToStop'))
    return
  }

  await ElMessageBox({
    type: 'warning',
    title: t('common.warning'),
    message: t('views.downloader.stopConfirm'),
    showCancelButton: true,
  })

  try {
    stopLoading.value = true
    await Promise.all(toStopTasks.map((task) => aria2.value?.remove(task.gid)))
    ElMessage.success(t('views.downloader.stopSuccess'))
  } catch {
    ElMessage.error(t('views.downloader.stopFailed'))
  } finally {
    stopLoading.value = false
    clearCheckedRows()
  }
}

async function removeTasks() {
  const toRemoveTasks = getTasks('to-remove')
  if (!toRemoveTasks) return
  if (!toRemoveTasks.length) {
    ElMessage.info(t('views.downloader.noTaskToRemove'))
    return
  }

  await ElMessageBox({
    type: 'warning',
    title: t('common.warning'),
    message: t('views.downloader.removeConfirm'),
    showCancelButton: true,
  })

  try {
    removeLoading.value = true
    await Promise.all(toRemoveTasks.map((task) => aria2.value?.removeDownloadResult(task.gid)))
    ElMessage.success(t('views.downloader.removeSuccess'))
  } catch {
    ElMessage.error(t('views.downloader.removeFailed'))
  } finally {
    removeLoading.value = false
    clearCheckedRows()
  }
}

async function startTask(task: Aria2Status) {
  if (!task) return
  if (!(task.status === 'paused' || task.status === 'waiting')) {
    ElMessage.info(t('views.downloader.noTaskToStart'))
    return
  }
  try {
    startLoading.value = true
    await aria2.value?.unpause(task.gid)
    ElMessage.success(t('views.downloader.startSuccess'))
  } catch {
    ElMessage.error(t('views.downloader.startFailed'))
  } finally {
    startLoading.value = false
  }
}

async function pauseTask(task: Aria2Status) {
  if (!task) return
  if (task.status !== 'active') {
    ElMessage.info(t('views.downloader.noTaskToPause'))
    return
  }
  try {
    pauseLoading.value = true
    await aria2.value?.pause(task.gid)
    ElMessage.success(t('views.downloader.pauseSuccess'))
  } catch {
    ElMessage.error(t('views.downloader.pauseFailed'))
  } finally {
    pauseLoading.value = false
  }
}

async function stopTask(task: Aria2Status) {
  if (!task) return
  const activeStates = ['active', 'waiting', 'paused']
  if (!activeStates.includes(task.status)) {
    ElMessage.info(t('views.downloader.noTaskToStop'))
    return
  }

  await ElMessageBox({
    type: 'warning',
    title: t('common.warning'),
    message: t('views.downloader.stopConfirm'),
    showCancelButton: true,
  })

  try {
    stopLoading.value = true
    await aria2.value?.remove(task.gid)
    ElMessage.success(t('views.downloader.stopSuccess'))
  } catch {
    ElMessage.error(t('views.downloader.stopFailed'))
  } finally {
    stopLoading.value = false
  }
}

async function removeTask(task: Aria2Status) {
  if (!task) return
  const removableStates = ['complete', 'error', 'removed']
  if (!removableStates.includes(task.status)) {
    ElMessage.info(t('views.downloader.noTaskToRemove'))
    return
  }

  await ElMessageBox({
    type: 'warning',
    title: t('common.warning'),
    message: t('views.downloader.removeConfirm'),
    showCancelButton: true,
  })

  try {
    removeLoading.value = true
    await aria2.value?.removeDownloadResult(task.gid)
    ElMessage.success(t('views.downloader.removeSuccess'))
  } catch {
    ElMessage.error(t('views.downloader.removeFailed'))
  } finally {
    removeLoading.value = false
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
    startTask,
    pauseTask,
    stopTask,
    removeTask,
  }
}
