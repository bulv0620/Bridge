import { remoteRef, RemoteRefMain } from '../../../utils/remoteRef'
import { getWindow } from '../../../utils/window'

export class FileStore {
  private list: RemoteRefMain<SharedFileInfo[]>

  constructor() {
    const mainWindow = getWindow('main')
    this.list = remoteRef(mainWindow!, 'shared-file-list', [])
  }

  async add(file: SharedFileInfo) {
    await this.cleanupExpired()
    this.list.value = [...this.list.value, file]
  }

  async delById(id: string) {
    this.list.value = this.list.value.filter((el) => el.id !== id)
  }

  async delAll() {
    this.list.value = []
  }

  async updateById(id: string, file: SharedFileInfo) {
    const list = this.list.value.map((el) => (el.id === id ? file : el))
    this.list.value = list
  }

  async getAll(): Promise<SharedFileInfo[]> {
    await this.cleanupExpired()
    return structuredClone(this.list.value)
  }

  async getById(id: string) {
    const file = this.list.value.find((file) => file.id === id)
    return file ? structuredClone(file) : undefined
  }

  private async cleanupExpired() {
    const now = Date.now()
    this.list.value = this.list.value.filter((file) => file.status.expiresAt > now)
  }
}
