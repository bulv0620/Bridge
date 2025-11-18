import { StorageEngine } from '../../core/storage-engine/StorageEngine'
import { createStorageEngineInstance } from '../../core/storage-engine/utils/StorageEngineFactory'

export class InstanceManager {
  private instance: StorageEngine | null = null
  private instanceConfig: StorageEngineConfig | null = null

  constructor() {}

  async createInstance(config: StorageEngineConfig) {
    if (this.instance) {
      this.clearInstance()
    }

    this.instanceConfig = config
    this.instance = createStorageEngineInstance(config)

    const valid = await this.instance.validate()

    if (!valid) {
      this.clearInstance()
      throw new Error('Invalid instance.')
    }
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
