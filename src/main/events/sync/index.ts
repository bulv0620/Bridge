import { IpcMainInvokeEvent } from 'electron'
import { SyncManager } from './utils/SyncManager'

const syncManager = new SyncManager()

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
