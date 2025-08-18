import { SyncManager } from './utils/SyncManager'

const syncManager = new SyncManager()

export function setStorageEngineConfig(
  type: 'source' | 'destination',
  config: StorageEngineConfig,
) {
  syncManager.setStorageEngineConfig(type, config)
}

export function setIgnoredFolders(folders: string[]) {
  syncManager.setIgnoredFolders(folders)
}

export function setSyncStrategy(strategy: SyncStrategy) {
  syncManager.setSyncStrategy(strategy)
}

export function diff() {
  return syncManager.diff()
}
