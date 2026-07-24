import { useRemoteRefReadonly } from '@renderer/composables/remote-ref/useRemoteRef'
import { i18n } from '@renderer/locales'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, ref } from 'vue'
import { createRendererLogger } from '@renderer/utils/logger'

const { t } = i18n.global
const logger = createRendererLogger('share')

const selection = ref<ShareFileSelection | null>(null)
const files = computed(() => selection.value?.files ?? [])
const batchRequesting = ref(false)
let selectionGeneration = 0

const activeTab = ref(0)
const sendingList = useRemoteRefReadonly<SendingItem[]>('sending-list', [])
const sentList = useRemoteRefReadonly<SentItem[]>('sent-list', [])
const receivingList = useRemoteRefReadonly<ReceivingItem[]>('receiving-list', [])
const receivedList = useRemoteRefReadonly<ReceivedItem[]>('received-list', [])

const tabs = computed(() => [
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
])

async function replaceSelection(rawFiles: File[]): Promise<boolean> {
  const generation = ++selectionGeneration
  if (rawFiles.length === 0) {
    await clearSelection()
    return true
  }

  try {
    const result = await window.shareFiles.register(rawFiles)
    if (generation !== selectionGeneration) {
      if (result.ok) await window.shareFiles.release(result.selection.id).catch(() => undefined)
      return false
    }

    if (!result.ok) {
      logger.warn('share.selection.invalid', { fileCount: rawFiles.length })
      ElMessage({
        message: t('views.sharedZone.invalidSelection'),
        type: 'error',
        plain: true,
      })
      return false
    }

    const nextSelection = result.selection
    const previousId = selection.value?.id
    selection.value = nextSelection
    if (previousId) await window.shareFiles.release(previousId).catch(() => undefined)
    return true
  } catch (error) {
    logger.error('share.selection.failed', error, { fileCount: rawFiles.length })
    ElMessage({
      message: t('views.sharedZone.invalidSelection'),
      type: 'error',
      plain: true,
    })
    return false
  }
}

async function clearSelection() {
  selectionGeneration += 1
  const selectionId = selection.value?.id
  selection.value = null
  if (selectionId) await window.shareFiles.release(selectionId).catch(() => undefined)
}

async function createSendingTask(onlineDevice: OnlineDevice) {
  if (
    batchRequesting.value ||
    !onlineDevice.services.cap.includes('file-push-v2') ||
    !selection.value
  ) {
    if (!selection.value) {
      ElMessage({
        message: t('views.sharedZone.selectFileFirst'),
        type: 'warning',
        plain: true,
      })
    }
    return
  }

  const selected = selection.value
  selection.value = null
  batchRequesting.value = true
  activeTab.value = 0
  logger.info('share.send.batch_requested', {
    selectionId: selected.id.slice(0, 8),
    targetDeviceId: onlineDevice.id.slice(0, 8),
    fileCount: selected.files.length,
    totalSize: selected.files.reduce((sum, file) => sum + file.size, 0),
  })

  try {
    await window.ipc.share.sendFileBatch(selected.id, onlineDevice.id)
  } catch (error) {
    const code = transferErrorCode(error)
    logger.error('share.send.batch_failed', error, {
      selectionId: selected.id.slice(0, 8),
      targetDeviceId: onlineDevice.id.slice(0, 8),
      fileCount: selected.files.length,
      reason: code,
    })
    ElMessage({
      message: t(`views.sharedZone.transferErrors.${code}`),
      type: code === 'BATCH_REJECTED' ? 'warning' : 'error',
      plain: true,
    })
  } finally {
    batchRequesting.value = false
  }
}

function transferErrorCode(error: unknown): FileTransferErrorCode {
  const message = error instanceof Error ? error.message : String(error)
  const codes: FileTransferErrorCode[] = [
    'INVALID_REQUEST',
    'REQUEST_TOO_LARGE',
    'FILE_PUSH_DISABLED',
    'RECEIVER_BUSY',
    'BATCH_REJECTED',
    'TRANSFER_NOT_FOUND',
    'TRANSFER_EXPIRED',
    'TRANSFER_UNAUTHORIZED',
    'TRANSFER_ALREADY_STARTED',
    'LENGTH_REQUIRED',
    'LENGTH_MISMATCH',
    'WRITE_FAILED',
    'NETWORK_ERROR',
    'SELECTION_EXPIRED',
    'FILE_CHANGED',
    'CANCELLED',
  ]
  return codes.find((code) => message.includes(code)) ?? 'NETWORK_ERROR'
}

function openFolder(filename: string) {
  window.ipc.file.openFolder(filename)
}

async function deleteTask(list: 'sent' | 'received', taskId: string) {
  await ElMessageBox({
    type: 'warning',
    title: t('common.warning'),
    message: t('views.sharedZone.confirmDeleteTask'),
    showCancelButton: true,
  })
  if (list === 'sent') {
    await window.ipc.share.deleteSentTask(taskId)
  } else {
    await window.ipc.share.deleteReceivedTask(taskId)
  }
}

async function abortTask(id: string) {
  await ElMessageBox({
    type: 'warning',
    title: t('common.warning'),
    message: t('views.sharedZone.confirmAbortTask'),
    showCancelButton: true,
  })

  const cancelled = await window.ipc.share.cancelSendingFile(id)
  if (!cancelled) {
    ElMessage({
      message: t('views.sharedZone.cannotCancel'),
      type: 'info',
      plain: true,
    })
  }
}

export function useTaskList() {
  return {
    files,
    selection,
    batchRequesting,
    activeTab,
    tabs,
    sendingList,
    sentList,
    receivingList,
    receivedList,
    replaceSelection,
    clearSelection,
    createSendingTask,
    openFolder,
    deleteTask,
    abortTask,
  }
}
