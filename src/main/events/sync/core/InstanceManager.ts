import { FtpStorageEngine } from '../engines/FtpStorageEngine'
import { StorageEngine } from '../engines/StorageEngine'

export class InstanceManager {
  private instance: StorageEngine | null = null
  private instanceConfig: StorageEngineConfig | null = null

  constructor() {}

  createInstance(config: StorageEngineConfig) {
    this.instanceConfig = config
    if (config.storageType === 'ftp') {
      this.instance = new FtpStorageEngine(config.connectionConfig!, config.path)
    }
  }

  listInstance(dir: string, ignoredFolders?: string[]) {
    return this.instance?.list(dir, ignoredFolders || [])
  }

  getInstanceConfig() {
    return this.instanceConfig
  }

  clearInstance() {
    this.instance = null
  }
}
