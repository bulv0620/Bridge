import { reactive, toRaw, watch } from 'vue'
import { i18n } from '@renderer/locales'
import { ElMessage } from 'element-plus'
import { getCachedSyncSession, setCachedSyncSession } from '@renderer/utils/local-cache'

interface SyncForm {
  sourceConfig: StorageEngineConfig | null // 源
  destinationConfig: StorageEngineConfig | null // 目标
  ignoredFolders: string[] // 忽略文件夹
  syncStrategy: SyncStrategy // 同步策略
}

interface SyncStatus {
  bytesTransferred: number
  totalBytes: number
  transferredCount: number
  totalCount: number
}

export interface SyncSessionState {
  sessionId: string
  name: string
  formData: SyncForm
  tableData: FileDifference[]
  status: SyncStatus
  isComparing: boolean
  isSyncing: boolean
}

export interface SyncSession {
  sessionState: SyncSessionState
  getRootList(): Promise<void>
  handleConfigChange(type: 'source' | 'destination'): Promise<void>
  handleStrategyChange(): Promise<void>
  startCompare(): Promise<void>
  stopCompare(): void
  startSync(): Promise<void>
  stopSync(): void
  dispose(): void
}

const { t } = i18n.global

export function useSyncSession(
  sessionId: string,
  initName?: string,
  initForm?: SyncForm,
): SyncSession {
  const sessionState = reactive<SyncSessionState>({
    sessionId,
    name: initName ?? t('views.fileSync.newTab'),
    formData: initForm ?? {
      sourceConfig: null,
      destinationConfig: null,
      ignoredFolders: [],
      syncStrategy: 'mirror',
    },
    tableData: [],
    status: {
      bytesTransferred: 0,
      totalBytes: 0,
      transferredCount: 0,
      totalCount: 0,
    },
    isComparing: false,
    isSyncing: false,
  })

  const stopCacheWatch = watch(
    () => [sessionState.name, sessionState.formData],
    () => {
      const cachedSessions = getCachedSyncSession()

      const oldItem = cachedSessions.find((session) => session.sessionId === sessionState.sessionId)

      if (oldItem) {
        oldItem.name = sessionState.name
        oldItem.formData = sessionState.formData
      } else {
        cachedSessions.push({
          sessionId: sessionState.sessionId,
          name: sessionState.name,
          formData: sessionState.formData,
          tableData: [],
          status: {
            bytesTransferred: 0,
            totalBytes: 0,
            transferredCount: 0,
            totalCount: 0,
          },
          isComparing: false,
          isSyncing: false,
        })
      }

      setCachedSyncSession(cachedSessions)
    },
    { immediate: true, deep: true },
  )

  const stopSourceWatch = watch(
    () => sessionState.formData.sourceConfig,
    () => {
      handleConfigChange('source')
    },
    { immediate: true },
  )

  const stopDestWatch = watch(
    () => sessionState.formData.destinationConfig,
    () => {
      handleConfigChange('destination')
    },
    { immediate: true },
  )

  const stopStrategyWatch = watch(
    () => sessionState.formData.syncStrategy,
    () => {
      handleStrategyChange()
    },
    { immediate: true },
  )

  const stopIgnoreFoldersWatch = watch(
    () => sessionState.formData.ignoredFolders,
    () => {
      window.ipc.sync.setIgnoredFolders(
        sessionState.sessionId,
        toRaw(sessionState.formData.ignoredFolders),
      )
    },
    { immediate: true },
  )

  // 获取比对结果树的root列表
  async function getRootList() {
    sessionState.tableData = []
    const result = await window.ipc.sync.getDiffItems(sessionState.sessionId, null)
    sessionState.tableData = result
  }

  // 源、目标配置变化
  async function handleConfigChange(type: 'source' | 'destination') {
    const configData =
      type === 'source'
        ? sessionState.formData.sourceConfig
        : sessionState.formData.destinationConfig
    window.ipc.sync.setStorageEngineConfig(sessionState.sessionId, type, toRaw(configData))
    sessionState.tableData = []
    resetSyncStatus()
  }

  // 策略变化
  async function handleStrategyChange() {
    const compareResult = await window.ipc.sync.setSyncStrategy(
      sessionState.sessionId,
      sessionState.formData.syncStrategy,
    )
    sessionState.status.totalCount = compareResult.totalCount
    sessionState.status.totalBytes = compareResult.totalBytes
    getRootList()
  }

  async function startCompare() {
    sessionState.isComparing = true
    sessionState.tableData = []
    resetSyncStatus()
    try {
      const [sourceValid, destValid] = await window.ipc.sync.validate(sessionState.sessionId)

      if (!sourceValid) {
        ElMessage.error(t('views.fileSync.sourceInvalid'))
        return
      }
      if (!destValid) {
        ElMessage.error(t('views.fileSync.destInvalid'))
        return
      }

      const compareResult = await window.ipc.sync.startCompare(sessionState.sessionId)
      sessionState.status.totalCount = compareResult.totalCount
      sessionState.status.totalBytes = compareResult.totalBytes

      getRootList()
    } catch (error) {
      console.log(error)
      ElMessage.error(t('views.fileSync.compareFailed'))
    } finally {
      sessionState.isComparing = false
    }
  }

  function stopCompare() {
    window.ipc.sync.stopCompare(sessionState.sessionId)
  }

  async function startSync() {
    sessionState.isSyncing = true
    try {
      const [sourceValid, destValid] = await window.ipc.sync.validate(sessionState.sessionId)

      if (!sourceValid) {
        ElMessage.error(t('views.fileSync.sourceInvalid'))
        return
      }
      if (!destValid) {
        ElMessage.error(t('views.fileSync.destInvalid'))
        return
      }

      window.events.on(`sync:updateStatus:${sessionState.sessionId}`, syncStatusHanlder)
      await window.ipc.sync.startSync(sessionState.sessionId)
    } catch (error) {
      console.log(error)
      ElMessage.error(t('views.fileSync.syncFailed'))
    } finally {
      sessionState.isSyncing = false
      window.events.off(`sync:updateStatus:${sessionState.sessionId}`, syncStatusHanlder)
      // 重新获取差异项
      getRootList()
    }
  }

  function stopSync() {
    window.ipc.sync.stopSync(sessionState.sessionId)
  }

  function syncStatusHanlder(status: SyncStatus) {
    sessionState.status.bytesTransferred = status.bytesTransferred
    sessionState.status.transferredCount = status.transferredCount
  }

  function resetSyncStatus() {
    sessionState.status.totalBytes = 0
    sessionState.status.bytesTransferred = 0
    sessionState.status.totalCount = 0
    sessionState.status.transferredCount = 0
  }

  function dispose() {
    stopCacheWatch()
    stopSourceWatch()
    stopDestWatch()
    stopStrategyWatch()
    stopIgnoreFoldersWatch()

    // 清理cache
    const cachedSessions = getCachedSyncSession()
    const cacheIndex = cachedSessions.findIndex((s) => s.sessionId === sessionState.sessionId)
    if (cacheIndex > -1) {
      cachedSessions.splice(cacheIndex, 1)
    }
    setCachedSyncSession(cachedSessions)
  }

  return {
    sessionState,
    dispose,
    getRootList,
    startCompare,
    stopCompare,
    startSync,
    stopSync,
    handleConfigChange,
    handleStrategyChange,
  }
}
