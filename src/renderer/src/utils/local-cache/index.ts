import { SyncSessionState } from '@renderer/composables/file-sync/useSyncSession'

const SYNC_SESSION_CACHE = 'SYNC_SESSION_CACHE' // 同步会话缓存

export function getCachedSyncSession() {
  return JSON.parse(localStorage.getItem(SYNC_SESSION_CACHE) || '[]') as SyncSessionState[]
}

export function setCachedSyncSession(sessions: SyncSessionState[]) {
  localStorage.setItem(SYNC_SESSION_CACHE, JSON.stringify(sessions))
}
