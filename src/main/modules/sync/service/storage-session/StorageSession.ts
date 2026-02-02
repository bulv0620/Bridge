import { StorageEngine } from '../../core/storage-engine/StorageEngine'
import { createStorageEngineInstance } from '../../core/storage-engine/utils/StorageEngineFactory'

export class StorageSession {
  private instance: StorageEngine
  private instanceConfig: StorageEngineConfig

  constructor(config: StorageEngineConfig) {
    this.instanceConfig = config
    this.instance = createStorageEngineInstance(config)
  }

  async validate() {
    const valid = await this.instance.validate()

    if (!valid) {
      this.disconnect()
      throw new Error('Invalid instance.')
    }
  }

  async list(dir: string, ignoredFolders?: string[]) {
    if (!this.instance) return []
    const list = await this.instance.list(dir, ignoredFolders || [])

    await this.instance.disconnect()
    return list.filter((item) => item.isDirectory)
  }

  getSessionConfig() {
    return this.instanceConfig
  }

  disconnect() {
    this.instance?.disconnect()
  }
}
