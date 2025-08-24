const ROOT_KEY = '__ROOT__'

export class DiffStore {
  private list: FileDifference[] = []
  private idIndex: Map<string, FileDifference> = new Map()
  private parentIdIndex: Map<string, FileDifference[]> = new Map()
  private deletedIds: Set<string> = new Set()

  add(diff: FileDifference) {
    this.list.push(diff)
    this.idIndex.set(diff.id, diff)

    const pid = diff.parentId ?? ROOT_KEY
    if (!this.parentIdIndex.has(pid)) {
      this.parentIdIndex.set(pid, [])
    }
    this.parentIdIndex.get(pid)!.push(diff)
  }

  delById(id: string) {
    this.deletedIds.add(id)

    if (this.deletedIds.size === this.list.length) {
      this.clear()
    }
  }

  delAll() {
    this.clear()
  }

  private clear() {
    this.list = []
    this.idIndex.clear()
    this.parentIdIndex.clear()
    this.deletedIds.clear()
  }

  update(diffItem: FileDifference) {
    const item = this.getById(diffItem.id)
    if (item) {
      Object.assign(item, diffItem)
    }
  }

  updateAll(list: FileDifference[]) {
    this.list = list
  }

  getLast(): FileDifference | undefined {
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

  getById(id: string): FileDifference | undefined {
    if (this.deletedIds.has(id)) return
    return this.idIndex.get(id)
  }

  getChildren(parentId: string | null): FileDifference[] {
    const pid = parentId ?? ROOT_KEY
    return (this.parentIdIndex.get(pid) || []).filter((item) => !this.deletedIds.has(item.id))
  }

  getAll() {
    return this.list.filter((item) => !this.deletedIds.has(item.id))
  }
}
