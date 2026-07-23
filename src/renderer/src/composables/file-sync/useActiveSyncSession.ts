import { computed, ref, watch } from 'vue'
import { useSyncSession } from './useSyncSession'
import { ElMessage } from 'element-plus'
import { i18n } from '@renderer/locales'

const { t } = i18n.global

const MAX_SYNC_SESSION_COUNT = 3
const sessions = ref<SyncSession[]>([])
const isCreatingSession = ref(false)
const canCreateSyncSession = computed(() => sessions.value.length < MAX_SYNC_SESSION_COUNT)

// 会话配置（用于缓存）
const sessionConfigList = computed<CacehdSession[]>(() =>
  sessions.value.map((session) => ({
    sessionId: session.sessionState.sessionId,
    name: session.sessionState.name,
    formData: session.sessionState.formData,
  })),
)

watch(
  sessionConfigList,
  (val) => {
    window.ipc.sync.cacheSessions(JSON.parse(JSON.stringify(val)))
  },
  { deep: true },
)

// 当前激活的会话
const activeSessionId = ref('')
const activeSession = computed(() => {
  return sessions.value.find((session) => session.sessionState.sessionId === activeSessionId.value)
})

// 当前的state
const activeSessionState = computed(() => activeSession.value?.sessionState)

// 初始化会话列表
async function initSessions() {
  const cachedSessions = await window.ipc.sync.getCachedSessions()
  const sessionsToRestore = cachedSessions.slice(0, MAX_SYNC_SESSION_COUNT)

  if (sessionsToRestore.length === 0) {
    // 没有历史会话时保持空状态，由用户主动创建
    activeSessionId.value = ''
    return
  } else {
    // 取缓存方案并创建主进程的session实例
    await Promise.all(
      sessionsToRestore.map((session) => window.ipc.sync.createSyncSession(session.sessionId)),
    )

    sessions.value = sessionsToRestore.map((session) =>
      useSyncSession(session.sessionId, session.name, session.formData),
    )
    activeSessionId.value = sessions.value[0].sessionState.sessionId
  }
}
initSessions() // 初始化即执行

// 新建会话
async function createSyncSession() {
  if (!canCreateSyncSession.value) {
    ElMessage({
      message: t('views.fileSync.sessionsFull'),
      type: 'warning',
      plain: true,
    })
    return false
  }

  if (isCreatingSession.value) return false

  isCreatingSession.value = true

  try {
    const sessionId = await window.ipc.sync.createSyncSession()

    const syncSession = useSyncSession(sessionId)
    sessions.value.push(syncSession)

    activeSessionId.value = sessionId
    return true
  } finally {
    isCreatingSession.value = false
  }
}

// 结束会话
async function closeSyncSession(id: string, index: number) {
  if (sessions.value.length === 1) {
    activeSessionId.value = ''
    sessions.value[0].dispose()
    sessions.value.splice(0)
    return
  }

  if (
    sessions.value[index].sessionState.isSyncing ||
    sessions.value[index].sessionState.isComparing
  ) {
    ElMessage({
      message: t('views.fileSync.inProgressPauseBeforeClose'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (activeSessionId.value === id) {
    if (sessions.value[index + 1]) {
      activeSessionId.value = sessions.value[index + 1].sessionState.sessionId
    } else {
      activeSessionId.value = sessions.value[index + -1].sessionState.sessionId
    }
  }

  // 删除操作
  sessions.value[index].dispose()
  sessions.value.splice(index, 1)

  await window.ipc.sync.closeSyncSession(id)
}

export function useActiveSyncSession() {
  return {
    sessions,
    activeSessionId,
    activeSession,
    activeSessionState,
    canCreateSyncSession,
    isCreatingSession,
    createSyncSession,
    closeSyncSession,
  }
}
