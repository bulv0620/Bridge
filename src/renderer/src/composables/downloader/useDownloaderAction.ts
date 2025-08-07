import { useDownloader } from './useDownloader'

import { useCreateDownloadTaskModal } from './useCreateDownloadTaskModal'
import { useDiscreteApi } from '../discrete-api/useDiscreteApi'
import { i18n } from '@renderer/locales'

const { t } = i18n.global
const { confirm, message } = useDiscreteApi()

const {
  aria2,
  isConnected,
  checkedRowKeys,
  toStartTasks,
  toPauseTasks,
  toStopTasks,
  toRemoveTasks,
  startLoading,
  pauseLoading,
  stopLoading,
  removeLoading,
} = useDownloader()

const { openCreateTaskModal } = useCreateDownloadTaskModal()

function createTask() {
  if (!aria2.value || !isConnected.value) {
    return
  }
  openCreateTaskModal()
}

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
    createTask,
    startTasks,
    pauseTasks,
    stopTasks,
    removeTasks,
  }
}
