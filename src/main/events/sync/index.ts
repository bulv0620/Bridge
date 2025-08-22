import { IpcMainInvokeEvent } from 'electron'
import { SyncManager } from './utils/SyncManager'
import { DiffStore } from './utils/diff-store/DiffStore'

const diffStore = new DiffStore()
const syncManager = new SyncManager(diffStore)

export function setStorageEngineConfig(
  _: IpcMainInvokeEvent,
  type: 'source' | 'destination',
  config: StorageEngineConfig | null,
) {
  syncManager.setStorageEngineConfig(type, config)
}

export function setIgnoredFolders(_: IpcMainInvokeEvent, folders: string[]) {
  syncManager.setIgnoredFolders(folders)
}

export function setSyncStrategy(_: IpcMainInvokeEvent, strategy: SyncStrategy) {
  syncManager.setSyncStrategy(strategy)
}

export function compare(_: IpcMainInvokeEvent) {
  return syncManager.compare()
}

export function stopCompare(_: IpcMainInvokeEvent) {
  return syncManager.setStopFlag(true)
}

export function syncFile(_: IpcMainInvokeEvent, differentItem: FileDifference) {
  return syncManager.syncFile(differentItem)
}

export function validate(_: IpcMainInvokeEvent) {
  return syncManager.validateStorageEngine()
}
