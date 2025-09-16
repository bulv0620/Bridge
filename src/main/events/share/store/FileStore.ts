export class FileStore {
  private list: SharedFileInfo[] = []

  async add(file: SharedFileInfo) {
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
    return this.list
  }
}
