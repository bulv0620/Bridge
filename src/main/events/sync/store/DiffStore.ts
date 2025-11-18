const ROOT_KEY = '__ROOT__'

export class DiffStore {
  private list: FileDifference[] = []
  private idIndex: Map<string, FileDifference> = new Map()
  private parentIdIndex: Map<string, FileDifference[]> = new Map()

  add(diff: FileDifference) {
    this.list.push(diff)
    this.idIndex.set(diff.id, diff)

    const pid = diff.parentId ?? ROOT_KEY
    if (!this.parentIdIndex.has(pid)) {
      this.parentIdIndex.set(pid, [])
    }
    this.parentIdIndex.get(pid)!.push(diff)
  }

  delLast() {
    const item = this.list.pop()
    if (!item) return

    // 删除索引
    this.idIndex.delete(item.id)
    this.parentIdIndex.delete(item.id)

    // 删除父级索引
    const parentId = item.parentId ?? ROOT_KEY
    const siblings = this.parentIdIndex.get(parentId)

    if (siblings) {
      this.parentIdIndex.set(
        parentId,
        siblings.filter((child) => child.id !== item.id),
      )
    }
  }

  delAll() {
    this.clear()
  }

  clear() {
    this.list = []
    this.idIndex.clear()
    this.parentIdIndex.clear()
  }

  updateById(id: string, diffItem: FileDifference) {
    const oldItem = this.idIndex.get(id)
    if (!oldItem) return

    const oldParentId = oldItem.parentId ?? ROOT_KEY
    Object.assign(oldItem, diffItem)
    const newParentId = oldItem.parentId ?? ROOT_KEY

    // 如果 parentId 变了，需要调整索引结构
    if (oldParentId !== newParentId) {
      const oldList = this.parentIdIndex.get(oldParentId)
      if (oldList) {
        this.parentIdIndex.set(
          oldParentId,
          oldList.filter((x) => x.id !== id),
        )
      }

      if (!this.parentIdIndex.has(newParentId)) {
        this.parentIdIndex.set(newParentId, [])
      }
      this.parentIdIndex.get(newParentId)!.push(oldItem)
    }
  }

  updateAll(list: FileDifference[]) {
    this.list = list
    this.idIndex.clear()
    this.parentIdIndex.clear()

    for (const diff of list) {
      this.idIndex.set(diff.id, diff)
      const pid = diff.parentId ?? ROOT_KEY
      if (!this.parentIdIndex.has(pid)) {
        this.parentIdIndex.set(pid, [])
      }
      this.parentIdIndex.get(pid)!.push(diff)
    }
  }

  getLast(): FileDifference | undefined {
    return this.list[this.list.length - 1]
  }

  getById(id: string): FileDifference | undefined {
    return this.idIndex.get(id)
  }

  getChildren(parentId: string | null): FileDifference[] {
    const pid = parentId ?? ROOT_KEY
    console.log(this.list)
    return this.parentIdIndex.get(pid) || []
  }

  getAll(): FileDifference[] {
    return this.list
  }
}
