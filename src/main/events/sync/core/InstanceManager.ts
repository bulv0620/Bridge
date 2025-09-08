import { StorageEngine } from '../engines/StorageEngine'
import { createStorageEngineInstance } from '../utils'

export class InstanceManager {
  private instance: StorageEngine | null = null
  private instanceConfig: StorageEngineConfig | null = null

  constructor() {}

  createInstance(config: StorageEngineConfig) {
    this.instanceConfig = config

    this.instance = createStorageEngineInstance(config)
  }

  async listInstance(dir: string, ignoredFolders?: string[]) {
    if (!this.instance) return []
    const list = await this.instance.list(dir, ignoredFolders || [])

    await this.instance.disconnect()
    return list.filter((item) => item.isDirectory)
  }

  getInstanceConfig() {
    return this.instanceConfig
  }

  clearInstance() {
    this.instance?.disconnect()
    this.instance = null
  }
}
