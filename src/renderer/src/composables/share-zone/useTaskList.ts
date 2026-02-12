import { useRemoteRef } from '@renderer/composables/remote-ref/useRemoteRef'
import { i18n } from '@renderer/locales'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, ref } from 'vue'
import axios from 'axios'
import { v4 as uuid } from 'uuid'

const { t } = i18n.global

// 选中的文件
const file = ref<File | null>(null)

const activeTab = ref(0)

const sendingControllerMap = new Map<string, AbortController>()

const sendingList = ref<SendingItem[]>([])
const sentList = ref<SentItem[]>([])
const receivingList = useRemoteRef('receiving-list', [])
const receivedList = useRemoteRef('received-list', [])

const tabs = computed(() => {
  return [
    {
      id: 0,
      name: t('views.sharedZone.sending'),
      num: sendingList.value.length,
    },
    {
      id: 1,
      name: t('views.sharedZone.sent'),
      num: sentList.value.length,
    },
    {
      id: 2,
      name: t('views.sharedZone.receiving'),
      num: receivingList.value.length,
    },
    {
      id: 3,
      name: t('views.sharedZone.received'),
      num: receivedList.value.length,
    },
  ]
})

async function createSendingTask(onlineDevice: OnlineDevice) {
  // 已在模板判断过，但这里再确保一次
  if (!onlineDevice.services.cap.includes('file-push')) {
    return
  }

  if (!file.value) {
    ElMessage({
      message: t('views.sharedZone.selectFileFirst'),
      type: 'warning',
      plain: true,
    })
    return
  }

  const f = file.value
  const myDeviceInfo = await window.ipc.share.getMyDeviceInfo()
  file.value = null

  // 准备发送的 meta
  const fileMeta: FileMeta = {
    filename: f.name,
    size: f.size,
    mime: f.type || undefined,
    device: myDeviceInfo,
  }

  // 新建项目
  const id = uuid()
  sendingList.value.unshift({
    id,
    meta: {
      ...fileMeta,
      device: onlineDevice.device,
    },
    status: 'pending',
    progress: {
      transferred: 0,
      total: fileMeta.size,
      percentage: 0,
      speed: 0,
      eta: 0,
    },
    createdAt: Date.now(),
  })
  const sendingItem = sendingList.value.find((el) => el.id === id)!

  const base = `http://${onlineDevice.ip}:${onlineDevice.services.http}/api`

  try {
    const reqeustUploadResult = await axios.post(`${base}/upload/request`, fileMeta)
    if (!reqeustUploadResult.data.allowed || !reqeustUploadResult.data.uploadId) {
      throw new Error('upload not allowed')
    }

    const uploadId = reqeustUploadResult.data.uploadId
    sendingItem.status = 'sending'

    await uploadFile(id, base, uploadId, f, (progress) => {
      sendingItem.progress = {
        ...sendingItem.progress,
        ...progress,
      }
    })

    sendingItem.progress = {
      ...sendingItem.progress,
      ...{
        transferred: fileMeta.size,
        percentage: 1,
      },
    }

    sentList.value.unshift({
      id,
      meta: sendingItem.meta,
      result: 'success',
      createdAt: sendingItem.createdAt,
      finishedAt: Date.now(),
    })
  } catch (err: any) {
    console.error(err)
    sentList.value.unshift({
      id,
      meta: sendingItem.meta,
      result: 'failed',
      error: {
        message: err && err.message ? String(err.message) : String(err),
      },
      createdAt: sendingItem.createdAt,
      finishedAt: Date.now(),
    })
  } finally {
    // 从任务列表中清除
    sendingList.value = sendingList.value.filter((item) => item.id !== sendingItem.id)
  }
}

async function uploadFile(
  id: string,
  base: string,
  uploadId: string,
  file: File,
  onProgress: (p: TransferProgress) => void,
) {
  const controller = new AbortController()

  sendingControllerMap.set(id, controller)

  const startTime = Date.now()
  let lastLoaded = 0
  let lastTime = startTime

  await axios.post(`${base}/upload/${uploadId}`, file, {
    signal: controller.signal,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    onUploadProgress: (ev) => {
      if (!ev.total) return

      const now = Date.now()
      const transferred = ev.loaded
      const total = ev.total
      const percentage = Math.min(transferred / total, 1)

      const deltaBytes = transferred - lastLoaded
      const deltaTime = (now - lastTime) / 1000 || 1
      const speed = deltaBytes / deltaTime
      const remaining = total - transferred
      const eta = speed > 0 ? remaining / speed : undefined

      lastLoaded = transferred
      lastTime = now

      onProgress({
        transferred,
        total,
        percentage,
        speed,
        eta,
      })
    },
  })
}

function openFolder(filename: string) {
  window.ipc.file.openFolder(filename)
}

async function deleteTask(list: any[], index: number) {
  await ElMessageBox({
    type: 'warning',
    title: t('common.warning'),
    message: t('views.sharedZone.confirmDeleteTask'),
    showCancelButton: true,
  })
  list.splice(index, 1)
}

async function abortTask(id: string) {
  await ElMessageBox({
    type: 'warning',
    title: t('common.warning'),
    message: t('views.sharedZone.confirmAbortTask'),
    showCancelButton: true,
  })

  const controller = sendingControllerMap.get(id)
  if (!controller) return

  controller.abort()
}

export function useTaskList() {
  return {
    file,
    activeTab,
    tabs,
    sendingList,
    sentList,
    receivingList,
    receivedList,
    createSendingTask,
    openFolder,
    deleteTask,
    abortTask,
  }
}
