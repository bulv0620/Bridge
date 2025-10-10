export class FileStore {
  private list: SharedFileInfo[] = []

  async add(file: SharedFileInfo) {
    await this.cleanupExpired()
    this.list.push(file)
  }

  async delById(id: string) {
    const index = this.list.findIndex((el) => el.id === id)
    this.list.splice(index, 1)
  }

  async delAll() {
    this.list = []
  }

  async getAll(): Promise<SharedFileInfo[]> {
    await this.cleanupExpired()
    return structuredClone(this.list)
  }

  async getById(id: string) {
    const file = this.list.find((file) => file.id === id)
    return file ? structuredClone(file) : undefined
  }

  async updateById(id: string, file: SharedFileInfo) {
    const index = this.list.findIndex((el) => el.id === id)
    if (index !== -1) {
      this.list[index] = file
    }
  }

  private async cleanupExpired() {
    const now = Date.now()
    this.list = this.list.filter((file) => file.status.expiresAt > now)
  }
}
