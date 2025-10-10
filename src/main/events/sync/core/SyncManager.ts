import { pipeline } from 'stream/promises'
import { StorageEngine } from '../engines/StorageEngine'
import { DiffStore } from '../store/DiffStore'
import { getResolution, getTransferByte, createStorageEngineInstance } from '../utils'
import { getWindow } from '../../../utils/window'
import { sendToRenderer } from '../../../utils/sender'

export class SyncManager {
  private sourceStorageEngine: StorageEngine | null = null
  private destinationStorageEngine: StorageEngine | null = null
  private ignoredFolders: string[] = []
  private syncStrategy: SyncStrategy = 'mirror'
  private stopFlag: boolean = false
  private diffStore: DiffStore = new DiffStore()

  private totalBytes: number = 0
  private totalCount: number = 0
  private bytesTransferred: number = 0
  private transferredCount: number = 0

  constructor() {}

  /**
   * 设置存储引擎配置
   * @param type
   * @param config
   */
  setStorageEngineConfig(type: 'source' | 'destination', config: StorageEngineConfig | null) {
    if (type === 'source') {
      if (config) {
        this.sourceStorageEngine = createStorageEngineInstance(config)
      } else {
        this.sourceStorageEngine = null
      }
    } else {
      if (config) {
        this.destinationStorageEngine = createStorageEngineInstance(config)
      } else {
        this.destinationStorageEngine = null
      }
    }
  }

  /**
   * 设置忽略文件夹
   * @param folders
   */
  setIgnoredFolders(folders: string[]) {
    this.ignoredFolders = folders
  }

  /**
   * 设置同步策略
   * @param strategy
   */
  async setSyncStrategy(strategy: SyncStrategy): Promise<CompareResult> {
    this.syncStrategy = strategy
    const diffItems = await this.diffStore.getAll()

    diffItems.forEach((item) => {
      if (item.isDirectory) return

      const transferByteTemp = item.transferBytes
      const resolutionTemp = item.resolution

      item.resolution = getResolution(strategy, !!item.source, !!item.destination)
      item.transferBytes = getTransferByte(item.resolution, item.source, item.destination)

      const byteChangeValue = item.transferBytes - transferByteTemp
      this.totalBytes += byteChangeValue

      if (resolutionTemp === 'ignore' && item.resolution !== 'ignore') {
        this.totalCount += 1
      } else if (resolutionTemp !== 'ignore' && item.resolution === 'ignore') {
        this.totalCount -= 1
      }
    })

    await this.diffStore.updateAll(diffItems)

    return {
      totalBytes: this.totalBytes,
      totalCount: this.totalCount,
    }
  }

  /**
   * 设置差异项目操作
   * @param id
   * @param resolution
   */
  async setResolution(id: string, resolution: FileSyncResolition): Promise<CompareResult> {
    const diffItem = await this.diffStore.getById(id)

    if (!diffItem) throw new Error('Not found')

    const transferByteTemp = diffItem.transferBytes

    diffItem.resolution = resolution
    diffItem.transferBytes = getTransferByte(resolution, diffItem.source, diffItem.destination)

    const byteChangeValue = diffItem.transferBytes - transferByteTemp
    this.totalBytes += byteChangeValue

    await this.diffStore.updateById(diffItem.id, diffItem)

    return {
      totalBytes: this.totalBytes,
      totalCount: this.totalCount,
    }
  }

  /**
   * 设置暂停标记
   * @param flag
   */
  setStopFlag(flag: boolean) {
    this.stopFlag = flag
  }

  /**
   * 获取子项
   * @param parentId
   * @returns
   */
  getChildren(parentId: string | null) {
    return this.diffStore.getChildren(parentId)
  }

  /**
   * 校验存储引擎是否可用
   * @returns
   */
  async validateStorageEngine(): Promise<[boolean, boolean]> {
    const validateResult: [boolean, boolean] = [true, true]
    if (!this.sourceStorageEngine) {
      validateResult[0] = false
    } else {
      validateResult[0] = await this.sourceStorageEngine.validate()
      await this.sourceStorageEngine.disconnect()
    }

    if (!this.destinationStorageEngine) {
      validateResult[1] = false
    } else {
      validateResult[1] = await this.destinationStorageEngine.validate()
      await this.destinationStorageEngine.disconnect()
    }

    return validateResult
  }

  /**
   * 对比函数
   * @returns
   */
  async compare(): Promise<CompareResult> {
    this.clearStatus()
    await this.diffStore.delAll()

    const differentStack: FileDifference[] = [
      {
        id: '',
        parentId: null,
        fileName: '',
        isDirectory: true,
        difference: '',
        resolution: '',
        source: { relativePath: '' } as FileInfo,
        destination: { relativePath: '' } as FileInfo,
        transferBytes: 0,
      },
    ]

    while (differentStack.length > 0 && !this.stopFlag) {
      const differentItem = differentStack.pop()!

      if (differentItem.isDirectory) {
        await this.compareDirectory(differentItem, differentStack)
      }

      await this.clearEmptyDirectory(differentItem.parentId)

      if (differentItem.id) {
        await this.diffStore.add(differentItem)
        if (!differentItem.isDirectory) {
          this.totalCount++
          this.totalBytes += differentItem.transferBytes
        }
      }
    }

    await this.clearEmptyDirectory(null)

    if (this.stopFlag) this.stopFlag = false

    await Promise.all([
      this.sourceStorageEngine?.disconnect(),
      this.destinationStorageEngine?.disconnect(),
    ])

    return {
      totalBytes: this.totalBytes,
      totalCount: this.totalCount,
    }
  }

  /**
   * 比对文件夹的子项
   * @param item
   * @param compareStack
   */
  private async compareDirectory(item: FileDifference, differentStack: FileDifference[]) {
    let sourceList: FileInfo[] = []
    let destList: FileInfo[] = []

    if (item.source) {
      const currentPath = item.source.relativePath
      sourceList = await this.sourceStorageEngine!.list(currentPath, this.ignoredFolders)
    }

    if (item.destination) {
      const currentPath = item.destination.relativePath
      destList = await this.destinationStorageEngine!.list(currentPath, this.ignoredFolders)
    }

    const fileMap = new Map<string, [FileInfo | null, FileInfo | null]>()
    for (const file of sourceList) {
      const key = (file.isDirectory ? '[D]' : '[F]') + file.fileName
      fileMap.set(key, [file, null])
    }

    for (const file of destList) {
      const key = (file.isDirectory ? '[D]' : '[F]') + file.fileName

      const mapItem = fileMap.get(key)
      if (mapItem) {
        if (!file.isDirectory && mapItem[0]!.size === file.size) {
          // 相同的文件去除（目前只比较【同名、同大小】），文件夹需要继续深入比较
          fileMap.delete(key)
        } else {
          mapItem[1] = file
        }
      } else {
        fileMap.set(key, [null, file])
      }
    }

    const stackItems = fileMap.values().toArray()

    stackItems.sort((a, b) => {
      const left = a[0] || a[1]
      const right = b[0] || b[1]
      if (left!.isDirectory !== right!.isDirectory) {
        return left!.isDirectory ? 1 : -1
      }
      return right!.fileName.localeCompare(left!.fileName)
    })

    differentStack.push(
      ...stackItems.map((entry) => {
        const [source, dest] = entry
        const id = ((source || dest)!.isDirectory ? '[D]' : '[F]') + (source || dest)!.relativePath
        const differentItem: FileDifference = {
          id,
          parentId: item.id ? item.id : null,
          fileName: (source || dest)!.fileName,
          isDirectory: (source || dest)!.isDirectory,
          difference: 'conflict',
          resolution: (source || dest)!.isDirectory
            ? ''
            : getResolution(this.syncStrategy, !!source, !!dest),
          source: source,
          destination: dest,
          transferBytes: 0,
        }
        differentItem.transferBytes = getTransferByte(
          differentItem.resolution,
          differentItem.source,
          differentItem.destination,
        )

        return differentItem
      }),
    )
  }

  private async clearEmptyDirectory(parentId: string | null) {
    let lastItem = await this.diffStore.getLast()
    while (lastItem && lastItem.isDirectory && (!parentId || parentId !== lastItem.id)) {
      await this.diffStore.delById(lastItem.id)
      lastItem = await this.diffStore.getLast()
    }
  }

  /**
   * 开始同步
   */
  async startSync() {
    const mainWindow = getWindow('main')
    const differentItems = await this.diffStore.getAll()

    let i = differentItems.length - 1
    while (i > -1 && !this.stopFlag) {
      const differentItem = differentItems[i]

      await this.syncFile(differentItem)
      if (!differentItem.isDirectory) {
        this.bytesTransferred += differentItem.transferBytes
        this.transferredCount++
      }

      sendToRenderer(mainWindow!, 'sync:updateStatus', {
        bytesTransferred: this.bytesTransferred,
        transferredCount: this.transferredCount,
      })

      await this.diffStore.delById(differentItem.id)
      i--
    }

    if (this.stopFlag) this.stopFlag = false

    await Promise.all([
      this.sourceStorageEngine?.disconnect(),
      this.destinationStorageEngine?.disconnect(),
    ])

    return
  }

  /**
   * 同步文件
   * @param diff
   * @returns
   */
  async syncFile(diff: FileDifference) {
    if (!this.sourceStorageEngine || !this.destinationStorageEngine) {
      throw new Error('Storage engine is not initialized')
    }
    if (diff.isDirectory || diff.resolution === 'ignore') return

    if (diff.resolution === 'toLeft') {
      if (diff.source) {
        await this.sourceStorageEngine?.delFile(diff.source.relativePath)
      }
      if (diff.destination) {
        // ←
        await this.transfer(
          this.destinationStorageEngine,
          this.sourceStorageEngine,
          diff.destination.relativePath,
        )
      }
    } else {
      if (diff.destination) {
        await this.destinationStorageEngine?.delFile(diff.destination.relativePath)
      }
      if (diff.source) {
        // →
        await this.transfer(
          this.sourceStorageEngine,
          this.destinationStorageEngine,
          diff.source.relativePath,
        )
      }
    }
  }

  /**
   * 文件移动
   * @param sourceStorageEngine
   * @param destinationStorageEngine
   * @param filePath
   */
  async transfer(
    sourceStorageEngine: StorageEngine,
    destinationStorageEngine: StorageEngine,
    filePath: string,
  ) {
    const readStreamAvailable = await sourceStorageEngine.exists(filePath)
    if (!readStreamAvailable) return

    const readStream = await sourceStorageEngine.createReadStream(filePath)
    const writeStream = await destinationStorageEngine.createWriteStream(filePath)

    await pipeline(readStream, writeStream)

    if ((writeStream as any)._DONE) {
      await (writeStream as any)._DONE
    }
  }

  private clearStatus() {
    this.totalBytes = 0
    this.totalCount = 0
    this.bytesTransferred = 0
    this.transferredCount = 0
  }
}
