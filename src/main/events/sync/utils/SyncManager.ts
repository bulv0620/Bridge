import { pipeline } from 'stream/promises'
import { FtpStorageEngine } from './storage-engine/FtpStorageEngine'
import { LocalStorageEngine } from './storage-engine/LocalStorageEngine'
import { StorageEngine } from './storage-engine/StorageEngine'

interface CompareStakItem {
  id: string | null
  parentId: string | null
  depth: number
  index: number
  entry: [FileInfo | null, FileInfo | null]
}

export class SyncManager {
  private sourceStorageEngine: StorageEngine | null
  private destinationStorageEngine: StorageEngine | null
  private ignoredFolders: string[]
  private syncStrategy: SyncStrategy
  private compareStack: CompareStakItem[] | null

  constructor() {
    this.sourceStorageEngine = null
    this.destinationStorageEngine = null
    this.ignoredFolders = []
    this.syncStrategy = 'mirror'
    this.compareStack = null
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
  setSyncStrategy(strategy: SyncStrategy) {
    this.syncStrategy = strategy
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
   * 对比函数
   * @returns
   */
  compare(): Promise<FileDifference | null> {
    if (!this.sourceStorageEngine || !this.destinationStorageEngine) {
      throw new Error('Storage engine is not initialized')
    }

    return this.compareFiles()
  }

  async compareFiles(): Promise<FileDifference | null> {
    if (!this.compareStack) {
      this.compareStack = []

      await this.detection({
        id: null,
        parentId: null,
        depth: 0,
        index: -1,
        entry: [{ relativePath: '' } as FileInfo, { relativePath: '' } as FileInfo],
      })
    }

    if (!this.compareStack.length) {
      this.compareStack = null
      return null
    }

    const stackItem = this.compareStack.pop()!
    const [source, dest] = stackItem.entry

    if ((source || dest)!.isDirectory) {
      await this.detection(stackItem)
    }

    const differenceItem: FileDifference = {
      id: stackItem.id!,
      parentId: stackItem.parentId,
      fileName: (source || dest)!.fileName,
      isDirectory: (source || dest)!.isDirectory,
      difference: 'conflict',
      resolution: this.getResolution(!!source, !!dest),
      source: source,
      destination: dest,
      children: [],
    }

    return differenceItem
  }

  async detection(item: CompareStakItem) {
    let sourceList: FileInfo[] = []
    let destList: FileInfo[] = []

    if (item.entry[0]) {
      const currentPath = item.entry[0].relativePath
      sourceList = await this.sourceStorageEngine!.list(currentPath, this.ignoredFolders)
    }

    if (item.entry[1]) {
      const currentPath = item.entry[1].relativePath
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

    this.compareStack?.push(
      ...stackItems.map((entry, index) => {
        const [source, dest] = entry
        const id = ((source || dest)!.isDirectory ? '[D]' : '[F]') + (source || dest)!.relativePath
        return {
          id,
          parentId: item.id,
          depth: item.depth + 1,
          index,
          entry,
        }
      }),
    )
  }

  private getResolution(sourceFlag: boolean, destFlag: boolean): FileSyncResolition {
    if (this.syncStrategy === 'mirror') {
      return 'toRight'
    } else if (this.syncStrategy === 'incremental') {
      if (!sourceFlag && destFlag) {
        return 'ignore'
      } else {
        return 'toRight'
      }
    } else {
      if (sourceFlag && destFlag) {
        return 'ignore'
      } else if (!sourceFlag) {
        return 'toLeft'
      } else {
        return 'toRight'
      }
    }
  }

  // async compareFiles(currentPath: string): Promise<FileDifference[]> {
  //   const children: FileDifference[] = []

  //   const [sourceList, destList] = await Promise.all([
  //     await this.sourceStorageEngine!.list(currentPath, this.ignoredFolders),
  //     await this.destinationStorageEngine!.list(currentPath, this.ignoredFolders),
  //   ])

  //   const fileMap = new Map<string, [FileInfo | null, FileInfo | null]>()
  //   for (const file of sourceList) {
  //     const key = (file.isDirectory ? '[D]' : '[F]') + file.relativePath
  //     fileMap.set(key, [file, null])
  //   }

  //   for (const file of destList) {
  //     const key = (file.isDirectory ? '[D]' : '[F]') + file.relativePath

  //     const mapItem = fileMap.get(key)
  //     if (mapItem) {
  //       mapItem[1] = file
  //     } else {
  //       fileMap.set(key, [null, file])
  //     }
  //   }

  //   for (const value of fileMap.values()) {
  //     const [source, dest] = value

  //     const differenceItem: FileDifference = {
  //       id: crypto.randomUUID(),
  //       fileName: (source || dest)!.fileName,
  //       isDirectory: (source || dest)!.isDirectory,
  //       difference: 'conflict',
  //       resolution: 'toRight',
  //       source: source,
  //       destination: dest,
  //       children: [],
  //     }

  //     if (source && dest) {
  //       if (source.isDirectory) {
  //         const comparePath = path.join(currentPath, source.fileName)
  //         differenceItem.children = await this.compareFiles(comparePath)
  //       }
  //       if (source.size === dest.size) continue
  //       children.push(differenceItem)
  //     } else if (source) {
  //       if (source.isDirectory) {
  //         const recursionPath = path.join(currentPath, source.fileName)
  //         differenceItem.children = await this.recursionDiffDir('onlySource', recursionPath)
  //       }
  //       children.push(differenceItem)
  //     } else if (dest) {
  //       if (dest.isDirectory) {
  //         const recursionPath = path.join(currentPath, dest.fileName)
  //         differenceItem.children = await this.recursionDiffDir('onlyDest', recursionPath)
  //       }
  //       children.push(differenceItem)
  //     }
  //   }

  //   children.sort((a, b) => {
  //     if (a.isDirectory === b.isDirectory) return 0
  //     return a.isDirectory ? -1 : 1
  //   })

  //   return children
  // }

  // async recursionDiffDir(
  //   type: 'onlySource' | 'onlyDest',
  //   currentPath: string,
  // ): Promise<FileDifference[]> {
  //   const children: FileDifference[] = []

  //   const storageEngine =
  //     type === 'onlySource' ? this.sourceStorageEngine : this.destinationStorageEngine

  //   const fileList = await storageEngine!.list(currentPath, this.ignoredFolders)

  //   for (const file of fileList) {
  //     children.push({
  //       id: crypto.randomUUID(),
  //       fileName: file.fileName,
  //       isDirectory: file.isDirectory,
  //       difference: 'conflict',
  //       resolution: 'toRight',
  //       source: type === 'onlySource' ? file : null,
  //       destination: type === 'onlyDest' ? file : null,
  //       children: file.isDirectory
  //         ? await this.recursionDiffDir(type, path.join(currentPath, file.fileName))
  //         : [],
  //     })
  //   }

  //   children.sort((a, b) => {
  //     if (a.isDirectory === b.isDirectory) return 0
  //     return a.isDirectory ? -1 : 1
  //   })

  //   return children
  // }

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
          this.destinationStorageEngine,
          this.sourceStorageEngine,
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
