export class SyncManager {
  private sourceFolder: SyncFolderInfo
  private targetFolder: SyncFolderInfo
  private syncType: 'mirror' | 'twoWay' | 'increment'

  constructor() {
    this.sourceFolder = {
      type: '',
      path: '',
    }
    this.targetFolder = {
      type: '',
      path: '',
    }
    this.syncType = 'mirror'
  }
}
