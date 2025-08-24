const ROOT_KEY = '__ROOT__'

export class DiffStore {
  private list: FileDifference[] = []
  private idIndex: Map<string, FileDifference> = new Map()
  private parentIdIndex: Map<string, FileDifference[]> = new Map()
  private deletedIds: Set<string> = new Set()

  async add(diff: FileDifference) {
    this.list.push(diff)
    this.idIndex.set(diff.id, diff)

    const pid = diff.parentId ?? ROOT_KEY
    if (!this.parentIdIndex.has(pid)) {
      this.parentIdIndex.set(pid, [])
    }
    this.parentIdIndex.get(pid)!.push(diff)
  }

  async delById(id: string) {
    this.deletedIds.add(id)

    if (this.deletedIds.size === this.list.length) {
      await this.clear()
    }
  }

  async delAll() {
    await this.clear()
  }

  private async clear() {
    this.list = []
    this.idIndex.clear()
    this.parentIdIndex.clear()
    this.deletedIds.clear()
  }

  async update(diffItem: FileDifference) {
    const item = this.getById(diffItem.id)
    if (item) {
      Object.assign(item, diffItem)
    }
  }

  async updateAll(list: FileDifference[]) {
    this.list = list
  }

  async getLast(): Promise<FileDifference | undefined> {
    if (!this.list.length) return

    let i = this.list.length - 1
    while (i > -1) {
      const diffItem = this.list[i]

      if (!this.deletedIds.has(diffItem.id)) {
        return diffItem
      }

      i--
    }

    return
  }

  async getById(id: string): Promise<FileDifference | undefined> {
    if (this.deletedIds.has(id)) return
    return this.idIndex.get(id)
  }

  async getChildren(parentId: string | null): Promise<FileDifference[]> {
    const pid = parentId ?? ROOT_KEY
    return (this.parentIdIndex.get(pid) || []).filter((item) => !this.deletedIds.has(item.id))
  }

  async getAll(): Promise<FileDifference[]> {
    return this.list.filter((item) => !this.deletedIds.has(item.id))
  }
}
