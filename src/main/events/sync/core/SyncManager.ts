import { pipeline } from 'stream/promises'
import { FtpStorageEngine } from '../engines/FtpStorageEngine'
import { LocalStorageEngine } from '../engines/LocalStorageEngine'
import { StorageEngine } from '../engines/StorageEngine'
import { DiffStore } from '../store/DiffStore'
import { getResolution, getTransferByte } from '../utils'

export class SyncManager {
  private sourceStorageEngine: StorageEngine | null = null
  private destinationStorageEngine: StorageEngine | null = null
  private ignoredFolders: string[] = []
  private syncStrategy: SyncStrategy = 'mirror'
  private stopFlag: boolean = false
  private diffStore: DiffStore

  private totalBytes: number = 0
  private totalCount: number = 0

  constructor(store: DiffStore) {
    this.diffStore = store
  }

  /**
   * 设置存储引擎配置
   * @param type
   * @param config
   */
  setStorageEngineConfig(type: 'source' | 'destination', config: StorageEngineConfig | null) {
    if (type === 'source') {
      if (config) {
        this.sourceStorageEngine = this.createStorageEngineInstance(config)
      } else {
        this.sourceStorageEngine = null
      }
    } else {
      if (config) {
        this.destinationStorageEngine = this.createStorageEngineInstance(config)
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
  setSyncStrategy(strategy: SyncStrategy): CompareResult {
    this.syncStrategy = strategy

    const diffItems = this.diffStore.getAll()

    this.totalBytes = 0
    this.totalCount = 0
    diffItems.forEach((item) => {
      if (item.isDirectory) return
      item.resolution = getResolution(strategy, !!item.source, !!item.destination)
      item.transferBytes = getTransferByte(item.resolution, item.source, item.destination)

      this.totalCount++
      this.totalBytes += item.transferBytes
    })

    this.diffStore.updateAll(diffItems)

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
  setResolution(id: string, resolution: FileSyncResolition): CompareResult {
    const diffItem = this.diffStore.getById(id)

    if (!diffItem) throw new Error('Not found')

    const transferByteTemp = diffItem.transferBytes

    diffItem.resolution = resolution
    diffItem.transferBytes = getTransferByte(resolution, diffItem.source, diffItem.destination)

    const byteChangeValue = diffItem.transferBytes - transferByteTemp
    this.totalBytes += byteChangeValue

    this.diffStore.update(diffItem)

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
   * 根据配置获取存储引擎实例对象
   * @param config
   * @returns
   */
  createStorageEngineInstance(config: StorageEngineConfig): StorageEngine {
    if (config.storageType === 'ftp') {
      return new FtpStorageEngine(config.connectionConfig!, config.path)
    } else {
      return new LocalStorageEngine(config.path)
    }
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
    }

    if (!this.destinationStorageEngine) {
      validateResult[1] = false
    } else {
      validateResult[1] = await this.destinationStorageEngine.validate()
    }

    return validateResult
  }

  /**
   * 对比函数
   * @returns
   */
  async compare(): Promise<CompareResult> {
    this.totalBytes = 0
    this.totalCount = 0

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
      } else {
        this.totalCount++
      }

      const lastItem = this.diffStore.getLast()
      if (
        lastItem &&
        lastItem.isDirectory &&
        (!differentItem.parentId || differentItem.parentId !== lastItem.id)
      ) {
        this.diffStore.delById(lastItem.id)
      }

      this.diffStore.add(differentItem)
      this.totalBytes += differentItem.transferBytes
    }

    if (this.stopFlag) this.stopFlag = false

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
    const readStream = await sourceStorageEngine.createReadStream(filePath)
    const writeStream = await destinationStorageEngine.createWriteStream(filePath)

    await pipeline(readStream, writeStream)
  }
}
