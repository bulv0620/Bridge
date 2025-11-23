import { computed, ref } from 'vue'
import { SyncSession, useSyncSession } from './useSyncSession'
import { getCachedSyncSession } from '@renderer/utils/local-cache'
import { ElMessage } from 'element-plus'
import { i18n } from '@renderer/locales'

const { t } = i18n.global

const sessions = ref<SyncSession[]>([])
// 当前激活的会话
const activeSessionId = ref('')
await initSessions()
const activeSession = computed(() => {
  return sessions.value.find((session) => session.sessionState.sessionId === activeSessionId.value)!
})

// 当前的state
const activeSessionState = computed(() => activeSession.value.sessionState)

// 初始化会话列表
async function initSessions() {
  const cachedSessions = getCachedSyncSession()
  if (cachedSessions.length === 0) {
    // 没有历史方案则创建一个新的
    await createSyncSession()
  } else {
    // 取缓存方案并创建主进程的session实例
    await Promise.all(
      cachedSessions.map((session) => window.ipc.sync.createSyncSession(session.sessionId)),
    )

    sessions.value = cachedSessions.map((session) =>
      useSyncSession(session.sessionId, session.name, session.formData),
    )
    activeSessionId.value = sessions.value[0].sessionState.sessionId
  }
}

// 新建会话
async function createSyncSession() {
  const sessionId = await window.ipc.sync.createSyncSession()

  const syncSession = useSyncSession(sessionId)
  sessions.value.push(syncSession)

  activeSessionId.value = sessionId
}

// 结束会话
async function closeSyncSession(id: string, index: number) {
  if (sessions.value.length === 1) {
    ElMessage.error(t('views.fileSync.lastCannotClose'))
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
    createSyncSession,
    closeSyncSession,
  }
}
