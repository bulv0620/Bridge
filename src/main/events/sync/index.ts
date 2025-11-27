import { IpcMainInvokeEvent } from 'electron'
import { StorageSession } from './service/storage-session/StorageSession'
import { SyncSession } from './service/sync-session/SyncSession'

const storageSessionMap = new Map<string, StorageSession>() // 连接会话
const syncSessionMap = new Map<string, SyncSession>() // 同步会话

// 创建同步会话
export function createSyncSession(_: IpcMainInvokeEvent, id?: string) {
  const uuid = id ?? crypto.randomUUID()
  const syncSession = new SyncSession(uuid)

  syncSessionMap.set(uuid, syncSession)

  return uuid
}

// 销毁同步会话
export function closeSyncSession(_: IpcMainInvokeEvent, id: string) {
  const item = syncSessionMap.get(id)!
  item.dispose()
  syncSessionMap.delete(id)
}

// 设置同步引擎配置
export function setStorageEngineConfig(
  _: IpcMainInvokeEvent,
  id: string,
  type: 'source' | 'destination',
  config: StorageEngineConfig | null,
) {
  const session = syncSessionMap.get(id)
  if (!session) return
  session.setStorageEngineConfig(type, config)
}

// 验证同步引擎是否可用
export function validate(_: IpcMainInvokeEvent, id: string) {
  const session = syncSessionMap.get(id)!
  return session.validateStorageEngine()
}

// 设置忽略文件夹
export function setIgnoredFolders(_: IpcMainInvokeEvent, id: string, folders: string[]) {
  const session = syncSessionMap.get(id)!
  session.setIgnoredFolders(folders)
}

// 设置同步策略
export function setSyncStrategy(_: IpcMainInvokeEvent, id: string, strategy: SyncStrategy) {
  const session = syncSessionMap.get(id)!
  return session.setSyncStrategy(strategy)
}

// 设置差异项操作
export function setResolution(
  _: IpcMainInvokeEvent,
  sessionId: string,
  rowId: string,
  resolution: FileSyncResolition,
) {
  const session = syncSessionMap.get(sessionId)!
  return session.setResolution(rowId, resolution)
}

// 获取父节点和祖父节点
export function getAncestorChain(_: IpcMainInvokeEvent, sessionId: string, id: string) {
  const session = syncSessionMap.get(sessionId)!

  const parent = session.getParent(id)
  if (!parent) {
    return {
      parent: undefined,
      grandParent: undefined,
    }
  }
  const grandParent = session.getParent(parent?.id)
  return {
    parent,
    grandParent,
  }
}

// 比对
export function startCompare(_: IpcMainInvokeEvent, id: string) {
  const session = syncSessionMap.get(id)!
  return session.compare()
}

// 停止比对
export function stopCompare(_: IpcMainInvokeEvent, id: string) {
  const session = syncSessionMap.get(id)!
  return session.setStopFlag(true)
}

// 获取差异项（树形懒加载）
export function getDiffItems(_: IpcMainInvokeEvent, id: string, parentId: string | null) {
  const session = syncSessionMap.get(id)!
  return session.getChildren(parentId)
}

// 同步
export function startSync(_: IpcMainInvokeEvent, id: string) {
  const session = syncSessionMap.get(id)!
  return session.startSync()
}

// 停止同步
export function stopSync(_: IpcMainInvokeEvent, id: string) {
  const session = syncSessionMap.get(id)!
  return session.setStopFlag(true)
}

// 创建连接实例
export async function createStorageSession(_: IpcMainInvokeEvent, config: StorageEngineConfig) {
  const session = new StorageSession(config)

  await session.validate()

  const uuid = crypto.randomUUID()
  storageSessionMap.set(uuid, session)

  return uuid
}

// 实例目录列表获取
export function listStorageSession(_: IpcMainInvokeEvent, id: string, dir: string) {
  const session = storageSessionMap.get(id)

  return session?.list(dir) || []
}

// 获取实例配置
export function getSessionConfig(_: IpcMainInvokeEvent, id: string) {
  const session = storageSessionMap.get(id)

  return session?.getSessionConfig()
}

// 释放实例
export function releaseSession(_: IpcMainInvokeEvent, id: string) {
  const session = storageSessionMap.get(id)
  session?.disconnect()

  storageSessionMap.delete(id)
}
