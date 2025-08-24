import { IpcMainInvokeEvent } from 'electron'
import { SyncManager } from './core/SyncManager'
import { DiffStore } from './store/DiffStore'

const diffStore = new DiffStore()
const syncManager = new SyncManager(diffStore)

// 设置同步引擎配置
export function setStorageEngineConfig(
  _: IpcMainInvokeEvent,
  type: 'source' | 'destination',
  config: StorageEngineConfig | null,
) {
  syncManager.setStorageEngineConfig(type, config)
}

// 验证同步引擎是否可用
export function validate(_: IpcMainInvokeEvent) {
  return syncManager.validateStorageEngine()
}

// 设置忽略文件夹
export function setIgnoredFolders(_: IpcMainInvokeEvent, folders: string[]) {
  syncManager.setIgnoredFolders(folders)
}

// 设置同步策略
export function setSyncStrategy(_: IpcMainInvokeEvent, strategy: SyncStrategy) {
  return syncManager.setSyncStrategy(strategy)
}

// 设置差异项操作
export function setResolution(_: IpcMainInvokeEvent, id: string, resolution: FileSyncResolition) {
  return syncManager.setResolution(id, resolution)
}

// 比对
export function startCompare(_: IpcMainInvokeEvent) {
  return syncManager.compare()
}

// 停止比对
export function stopCompare(_: IpcMainInvokeEvent) {
  return syncManager.setStopFlag(true)
}

// 获取差异项（树形懒加载）
export function getDiffItems(_: IpcMainInvokeEvent, parentId: string | null) {
  return diffStore.getChildren(parentId)
}

// 同步
export function startSync(_: IpcMainInvokeEvent) {
  return syncManager.startSync()
}

// 停止同步
export function stopSync(_: IpcMainInvokeEvent) {
  return syncManager.setStopFlag(true)
}
