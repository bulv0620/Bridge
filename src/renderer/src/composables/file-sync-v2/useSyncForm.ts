import { computed, ComputedRef, reactive, ref, toRaw, watch } from 'vue'
import { i18n } from '@renderer/locales'
import { useDiscreteApi } from '../discrete-api/useDiscreteApi'
import { useFileList } from './useFileList'

interface SyncStatus {
  bytesTransferred: number
  totalBytes: ComputedRef<number>
  transferredCount: number
  totalCount: number
}

const { t } = i18n.global
const { confirm, message } = useDiscreteApi()

const { diffFileList } = useFileList()

const syncStatus = reactive<SyncStatus>({
  bytesTransferred: 0,
  totalBytes: computed(() => diffFileList.value.reduce((acc, cur) => acc + cur.transferBytes, 0)),
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

const isFormCompleted = computed(() => {
  return !!syncForm.sourceConfig && !!syncForm.destinationConfig
})

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

watch(
  () => syncForm.sourceConfig,
  (newVal) => {
    window.ipc.sync.setStorageEngineConfig('source', toRaw(newVal))
    diffFileList.value = []
    resetSyncStatus()
  },
)

watch(
  () => syncForm.destinationConfig,
  (newVal) => {
    window.ipc.sync.setStorageEngineConfig('destination', toRaw(newVal))
    diffFileList.value = []
    resetSyncStatus()
  },
)

watch(
  () => syncForm.ignoredFolders,
  (newVal) => {
    window.ipc.sync.setIgnoredFolders(toRaw(newVal))
  },
)

watch(
  () => syncForm.syncStrategy,
  (newStrategy) => {
    window.ipc.sync.setSyncStrategy(newStrategy)
    diffFileList.value.forEach((diffItem) => {
      if (diffItem.isDirectory) return
      diffItem.resolution = getResolution(newStrategy, !!diffItem.source, !!diffItem.destination)
      diffItem.transferBytes = getTransferByte(
        diffItem.resolution,
        diffItem.source,
        diffItem.destination,
      )
    })
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

    const compareResult = await window.ipc.sync.compare()
    diffFileList.value = compareResult.differentItems
    syncStatus.totalCount = compareResult.totalCount
  } catch (error) {
    message.error(t('views.fileSyncV2.compareFailed'))
  } finally {
    isComparing.value = false
  }
}

function stopCompare() {
  window.ipc.sync.stopCompare()
}

function getResolution(
  syncStrategy: SyncStrategy,
  sourceFlag: boolean,
  destFlag: boolean,
): FileSyncResolition {
  if (syncStrategy === 'mirror') {
    return 'toRight'
  } else if (syncStrategy === 'incremental') {
    if (!sourceFlag && destFlag) {
      return 'ignore'
    } else {
      return 'toRight'
    }
  } else {
    if (sourceFlag && destFlag) {
      return 'ignore'
    } else if (!sourceFlag) {
      return 'toLeft'
    } else {
      return 'toRight'
    }
  }
}

function getTransferByte(
  resolution: FileSyncResolition,
  source: FileInfo | null,
  dest: FileInfo | null,
) {
  if (resolution === 'ignore') {
    return 0
  } else if (resolution === 'toLeft') {
    if (dest) {
      return dest.size
    } else {
      return 0
    }
  } else {
    if (source) {
      return source.size
    } else {
      return 0
    }
  }
}

function resetSyncStatus() {
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
    resetForm,
    startCompare,
    stopCompare,
    getResolution,
    getTransferByte,
  }
}
