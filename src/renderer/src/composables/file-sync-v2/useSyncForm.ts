import { computed, reactive, ref, toRaw, watch } from 'vue'
import { i18n } from '@renderer/locales'
import { useDiscreteApi } from '../discrete-api/useDiscreteApi'
import { useFileList } from './useFileList'

interface SyncStatus {
  bytesTransferred: number
  totalBytes: number
  transferredCount: number
  totalCount: number
}

const { t } = i18n.global
const { confirm, message } = useDiscreteApi()

const { diffFileList, getRootList } = useFileList()

const syncStatus = reactive<SyncStatus>({
  bytesTransferred: 0,
  totalBytes: 0,
  transferredCount: 0,
  totalCount: 0,
})

const syncForm = reactive<FileSyncPlan>({
  name: t('views.fileSyncV2.newPlan'),
  sourceConfig: null,
  destinationConfig: null,
  ignoredFolders: [],
  syncStrategy: 'mirror',
})
const isComparing = ref(false)
const isSyncing = ref(false)

const syncStopFlag = ref(false)

const isFormCompleted = computed(() => {
  return !!syncForm.sourceConfig && !!syncForm.destinationConfig
})

// 监听源位置变化
watch(
  () => syncForm.sourceConfig,
  (newVal) => {
    window.ipc.sync.setStorageEngineConfig('source', toRaw(newVal))
    diffFileList.value = []
    resetSyncStatus()
  },
)

// 监听目标配置变化
watch(
  () => syncForm.destinationConfig,
  (newVal) => {
    window.ipc.sync.setStorageEngineConfig('destination', toRaw(newVal))
    diffFileList.value = []
    resetSyncStatus()
  },
)

// 监听忽略文件夹变化
watch(
  () => syncForm.ignoredFolders,
  (newVal) => {
    window.ipc.sync.setIgnoredFolders(toRaw(newVal))
  },
)

// 监听策略变化
watch(
  () => syncForm.syncStrategy,
  async (newStrategy) => {
    const compareResult = await window.ipc.sync.setSyncStrategy(newStrategy)
    syncStatus.totalCount = compareResult.totalCount
    syncStatus.totalBytes = compareResult.totalBytes
    getRootList()
  },
)

async function startCompare() {
  isComparing.value = true
  diffFileList.value = []
  resetSyncStatus()
  try {
    const [sourceValid, destValid] = await window.ipc.sync.validate()

    if (!sourceValid) {
      message.error(t('views.fileSyncV2.sourceInvalid'))
      return
    }
    if (!destValid) {
      message.error(t('views.fileSyncV2.destInvalid'))
      return
    }

    const compareResult = await window.ipc.sync.startCompare()
    syncStatus.totalCount = compareResult.totalCount
    syncStatus.totalBytes = compareResult.totalBytes

    getRootList()
  } catch (error) {
    console.log(error)
    message.error(t('views.fileSyncV2.compareFailed'))
  } finally {
    isComparing.value = false
  }
}

function stopCompare() {
  window.ipc.sync.stopCompare()
}

async function startSync() {
  isSyncing.value = true
  try {
    const [sourceValid, destValid] = await window.ipc.sync.validate()

    if (!sourceValid) {
      message.error(t('views.fileSyncV2.sourceInvalid'))
      return
    }
    if (!destValid) {
      message.error(t('views.fileSyncV2.destInvalid'))
      return
    }

    // todo
  } catch (error) {
    console.log(error)
    message.error(t('views.fileSyncV2.syncFailed'))
  } finally {
    isSyncing.value = false
  }
}

function stopSync() {
  syncStopFlag.value = true
}

async function resetForm() {
  await confirm('warning', {
    title: t('common.warning'),
    content: t('views.fileSyncV2.newPlanConfirm'),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
  })

  syncForm.name = t('views.fileSyncV2.newPlan')
  syncForm.sourceConfig = null
  syncForm.destinationConfig = null
  syncForm.ignoredFolders = []
  syncForm.syncStrategy = 'mirror'
}

function resetSyncStatus() {
  syncStatus.totalBytes = 0
  syncStatus.bytesTransferred = 0
  syncStatus.totalCount = 0
  syncStatus.transferredCount = 0
}

export function useSyncForm() {
  return {
    syncStatus,
    syncForm,
    isFormCompleted,
    isComparing,
    isSyncing,
    startCompare,
    stopCompare,
    startSync,
    stopSync,
    resetForm,
    resetSyncStatus,
  }
}
