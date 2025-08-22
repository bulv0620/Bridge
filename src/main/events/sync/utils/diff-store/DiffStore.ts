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

  getById(id: string): FileDifference | undefined {
    return this.idIndex.get(id)
  }

  getChildren(parentId: string | null): FileDifference[] {
    const pid = parentId ?? ROOT_KEY
    return this.parentIdIndex.get(pid) || []
  }

  updateResolution(id: string, resolution: FileSyncResolition) {
    const item = this.idIndex.get(id)
    if (item) {
      item.resolution = resolution
    }
  }

  getAll() {
    return this.list
  }
}
