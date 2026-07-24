import { pipeline } from 'stream/promises'
import { StorageEngine } from '../../core/storage-engine/StorageEngine'
import { DiffStore, ROOT_KEY } from '../../store/DiffStore'
import { getResolution, getTransferByte } from './utils'
import { getWindow } from '../../../../utils/window'
import { createStorageEngineInstance } from '../../core/storage-engine/utils/StorageEngineFactory'
import { createLogger, shortId } from '../../../../services/logging'

export class SyncSession {
  private sourceStorageEngine: StorageEngine | null = null // 源
  private destinationStorageEngine: StorageEngine | null = null // 目标
  private ignoredFolders: string[] = [] // 忽略文件夹
  private syncStrategy: SyncStrategy = 'mirror' // 同步策略
  private stopFlag: boolean = false // 暂停标记
  private diffStore: DiffStore // 比对数据存储（内存存储，比对量巨大容易引起内存暴增）

  private toLeftCount: number = 0 // <-的总数
  private toRightCount: number = 0 // ->的总数
  private ignoreCount: number = 0 // 忽略的总数
  private totalBytes: number = 0 // 需要同步的bytes
  private totalCount: number = 0 // 需要同步的文件数
  private bytesTransferred: number = 0 // 已经同步的bytes
  private transferredCount: number = 0 // 已经同步的文件数
  private sourceStorageType: StorageType | null = null
  private destinationStorageType: StorageType | null = null
  private logger = createLogger('sync')

  constructor(
    private sessionId: string, // sessionId
  ) {
    this.diffStore = new DiffStore()
  }

  /**
   * 清理
   */
  dispose() {
    this.stopFlag = true
    this.sourceStorageEngine?.disconnect()
    this.destinationStorageEngine?.disconnect()
    this.sourceStorageEngine = null
    this.destinationStorageEngine = null
    this.ignoredFolders = []
    this.diffStore.delAll()
    this.logger.debug('sync.session.disposed', { sessionId: shortId(this.sessionId) })
  }

  /**
   * 设置存储引擎配置
   * @param type
   * @param config
   */
  setStorageEngineConfig(type: 'source' | 'destination', config: StorageEngineConfig | null) {
    if (type === 'source') {
      if (config) {
        this.sourceStorageEngine = createStorageEngineInstance(config)
        this.sourceStorageType = config.storageType
      } else {
        this.sourceStorageEngine = null
        this.sourceStorageType = null
      }
    } else {
      if (config) {
        this.destinationStorageEngine = createStorageEngineInstance(config)
        this.destinationStorageType = config.storageType
      } else {
        this.destinationStorageEngine = null
        this.destinationStorageType = null
      }
    }
  }

  /**
   * 设置忽略文件夹
   * @param folders
   */
  setIgnoredFolders(folders: string[]) {
    this.ignoredFolders = folders
    this.logger.debug('sync.ignored_folders.updated', {
      sessionId: shortId(this.sessionId),
      count: folders.length,
    })
  }

  /**
   * 设置同步策略
   * @param strategy
   */
  async setSyncStrategy(strategy: SyncStrategy): Promise<CompareResult> {
    this.syncStrategy = strategy
    const diffItems = this.diffStore.getAll()

    diffItems.forEach((item) => {
      if (item.isDirectory) return

      const transferByteTemp = item.transferBytes
      const itemTemp = { ...item }

      item.resolution = getResolution(strategy, !!item.source, !!item.destination)
      item.transferBytes = getTransferByte(item.resolution, item.source, item.destination)

      const byteChangeValue = item.transferBytes - transferByteTemp
      this.totalBytes += byteChangeValue

      // 更新总数
      this.updateTotals(item, itemTemp)
    })

    this.diffStore.updateAll(diffItems)

    this.computeResolutionCount()
    this.logger.info('sync.strategy.changed', {
      sessionId: shortId(this.sessionId),
      strategy,
      totalCount: this.totalCount,
      totalBytes: this.totalBytes,
    })

    return {
      totalBytes: this.totalBytes,
      totalCount: this.totalCount,
      toLeftCount: this.toLeftCount,
      toRightCount: this.toRightCount,
      ignoreCount: this.ignoreCount,
    }
  }

  /**
   * 设置差异项目操作
   * @param id
   * @param resolution
   */
  async setResolution(id: string, resolution: FileSyncResolition): Promise<CompareResult> {
    const diffItem = this.diffStore.getById(id)

    if (!diffItem) throw new Error('Not found')

    const itemItem = { ...diffItem }

    diffItem.resolution = resolution
    diffItem.transferBytes = getTransferByte(resolution, diffItem.source, diffItem.destination)

    // 更新总数
    this.updateTotals(diffItem, itemItem)

    this.diffStore.updateById(diffItem.id, diffItem)

    this.computeResolutionCount()

    return {
      totalBytes: this.totalBytes,
      totalCount: this.totalCount,
      toLeftCount: this.toLeftCount,
      toRightCount: this.toRightCount,
      ignoreCount: this.ignoreCount,
    }
  }

  /**
   * 设置暂停标记
   * @param flag
   */
  setStopFlag(flag: boolean) {
    this.stopFlag = flag
    if (flag) {
      this.logger.info('sync.stop.requested', { sessionId: shortId(this.sessionId) })
    }
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
   * 获取父项
   * @param id
   * @returns
   */
  getParent(id: string) {
    const item = this.diffStore.getById(id)
    if (!item) return
    if (!item.parentId) return
    return this.diffStore.getById(item.parentId)
  }

  /**
   * 校验存储引擎是否可用
   * @returns
   */
  async validateStorageEngine(): Promise<[boolean, boolean]> {
    const startedAt = Date.now()
    const validateResult: [boolean, boolean] = [true, true]
    try {
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

      this.logger.info('sync.storage.validation_completed', {
        sessionId: shortId(this.sessionId),
        sourceType: this.sourceStorageType,
        destinationType: this.destinationStorageType,
        sourceValid: validateResult[0],
        destinationValid: validateResult[1],
        durationMs: Date.now() - startedAt,
      })
      return validateResult
    } catch (error) {
      this.logger.error('sync.storage.validation_failed', error, {
        sessionId: shortId(this.sessionId),
        sourceType: this.sourceStorageType,
        destinationType: this.destinationStorageType,
        durationMs: Date.now() - startedAt,
      })
      throw error
    }
  }

  /**
   * 获取容量信息
   */
  async getCapacity(type: 'source' | 'destination') {
    if (type === 'source') {
      return this.sourceStorageEngine?.getCapacity() ?? { status: 'unsupported' as const }
    } else {
      return this.destinationStorageEngine?.getCapacity() ?? { status: 'unsupported' as const }
    }
  }

  /**
   * 对比函数
   * @returns
   */
  async compare(): Promise<CompareResult> {
    const startedAt = Date.now()
    this.logger.info('sync.compare.started', {
      sessionId: shortId(this.sessionId),
      strategy: this.syncStrategy,
      sourceType: this.sourceStorageType,
      destinationType: this.destinationStorageType,
    })
    this.clearStatus()
    this.diffStore.delAll()

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

    try {
      while (differentStack.length > 0 && !this.stopFlag) {
        const differentItem = differentStack.pop()!

        if (differentItem.isDirectory) {
          await this.compareDirectory(differentItem, differentStack)
        }

        await this.clearEmptyDirectory(differentItem.parentId)

        if (differentItem.id) {
          this.diffStore.add(differentItem)
          // 更新记数
          this.updateTotals(differentItem, null)
        }
      }

      await this.clearEmptyDirectory(null)

      const cancelled = this.stopFlag
      if (this.stopFlag) this.stopFlag = false

      await Promise.all([
        this.sourceStorageEngine?.disconnect(),
        this.destinationStorageEngine?.disconnect(),
      ])

      this.computeResolutionCount()

      const result = {
        totalBytes: this.totalBytes,
        totalCount: this.totalCount,
        toLeftCount: this.toLeftCount,
        toRightCount: this.toRightCount,
        ignoreCount: this.ignoreCount,
      }
      this.logger.info(cancelled ? 'sync.compare.cancelled' : 'sync.compare.completed', {
        sessionId: shortId(this.sessionId),
        ...result,
        durationMs: Date.now() - startedAt,
      })
      return result
    } catch (error) {
      this.logger.error('sync.compare.failed', error, {
        sessionId: shortId(this.sessionId),
        durationMs: Date.now() - startedAt,
      })
      throw error
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

    this.logger.debug('sync.directory.scanned', {
      sessionId: shortId(this.sessionId),
      relativePath: item.source?.relativePath ?? item.destination?.relativePath ?? '',
      sourceCount: sourceList.length,
      destinationCount: destList.length,
    })

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
   * 清理空目录
   * @param parentId
   */
  private async clearEmptyDirectory(parentId: string | null) {
    let lastItem = this.diffStore.getLast()
    while (lastItem && lastItem.isDirectory && (!parentId || parentId !== lastItem.id)) {
      this.diffStore.delLast()
      lastItem = this.diffStore.getLast()
    }
  }

  /**
   * 后序遍历得到文件夹的信息
   */
  computeResolutionCount() {
    const fileList = this.diffStore.getAll()
    for (const item of fileList) {
      if (item.isDirectory) {
        item.toLeftCount = 0
        item.toRightCount = 0
      }
    }

    const ROOT = ROOT_KEY

    // 栈元素格式：{ node, visited }
    const stack: { node: FileDifference; visited: boolean }[] = []

    // 所有根节点推栈
    const roots = this.diffStore.getChildren(ROOT) || []
    for (const root of roots) {
      stack.push({ node: root, visited: false })
    }

    while (stack.length) {
      const { node, visited } = stack.pop()!
      if (!visited) {
        // 第一次访问：标记一下，并把它的 children 推入栈
        stack.push({ node, visited: true })

        const children = this.diffStore.getChildren(node.id) || []
        for (const child of children.filter((c) => c.isDirectory)) {
          stack.push({ node: child, visited: false })
        }
      } else {
        // 第二次访问：children 都处理完了，可以统计
        let left = 0
        let right = 0

        // 累加子节点
        const children = this.diffStore.getChildren(node.id) || []
        for (const c of children) {
          left += c.toLeftCount ?? (c.resolution === 'toLeft' ? 1 : 0)
          right += c.toRightCount ?? (c.resolution === 'toRight' ? 1 : 0)
        }

        // 写回（只给目录）
        if (node.isDirectory) {
          node.toLeftCount = left
          node.toRightCount = right
        }
      }
    }
  }

  /**
   * 开始同步
   */
  async startSync() {
    const mainWindow = getWindow('main')
    const startedAt = Date.now()
    this.logger.info('sync.started', {
      sessionId: shortId(this.sessionId),
      strategy: this.syncStrategy,
      sourceType: this.sourceStorageType,
      destinationType: this.destinationStorageType,
      totalCount: this.totalCount,
      totalBytes: this.totalBytes,
    })

    try {
      let differentItem = this.diffStore.getLast()
      while (!!differentItem && !this.stopFlag) {
        await this.syncFile(differentItem)
        if (!differentItem.isDirectory) {
          this.bytesTransferred += differentItem.transferBytes
          this.transferredCount++
        }

        mainWindow!.webContents.send(`sync:updateStatus:${this.sessionId}`, {
          bytesTransferred: this.bytesTransferred,
          transferredCount: this.transferredCount,
        })

        this.diffStore.delLast()
        this.clearEmptyDirectory(null)
        differentItem = this.diffStore.getLast()
      }

      const cancelled = this.stopFlag
      if (this.stopFlag) this.stopFlag = false

      await Promise.all([
        this.sourceStorageEngine?.disconnect(),
        this.destinationStorageEngine?.disconnect(),
      ])

      this.logger.info(cancelled ? 'sync.cancelled' : 'sync.completed', {
        sessionId: shortId(this.sessionId),
        bytesTransferred: this.bytesTransferred,
        transferredCount: this.transferredCount,
        durationMs: Date.now() - startedAt,
      })
    } catch (error) {
      this.logger.error('sync.failed', error, {
        sessionId: shortId(this.sessionId),
        bytesTransferred: this.bytesTransferred,
        transferredCount: this.transferredCount,
        durationMs: Date.now() - startedAt,
      })
      throw error
    }
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
    if (diff.isDirectory) return

    const relativePath = diff.source?.relativePath ?? diff.destination?.relativePath
    const context = {
      sessionId: shortId(this.sessionId),
      resolution: diff.resolution,
      relativePath,
      size: diff.transferBytes,
    }

    if (diff.resolution === 'ignore') {
      this.logger.debug('sync.file.skipped', context)
      return
    }

    try {
      if (diff.resolution === 'toLeft') {
        if (diff.source) {
          this.logger.debug('sync.file.delete.started', {
            ...context,
            storageType: this.sourceStorageType,
          })
          await this.sourceStorageEngine.delFile(diff.source.relativePath)
          this.logger.debug('sync.file.delete.completed', {
            ...context,
            storageType: this.sourceStorageType,
          })
        }
        if (diff.destination) {
          this.logger.debug('sync.file.copy.started', {
            ...context,
            sourceType: this.destinationStorageType,
            destinationType: this.sourceStorageType,
          })
          await this.transfer(
            this.destinationStorageEngine,
            this.sourceStorageEngine,
            diff.destination.relativePath,
          )
          this.logger.debug('sync.file.copy.completed', {
            ...context,
            sourceType: this.destinationStorageType,
            destinationType: this.sourceStorageType,
          })
        }
      } else {
        if (diff.destination) {
          this.logger.debug('sync.file.delete.started', {
            ...context,
            storageType: this.destinationStorageType,
          })
          await this.destinationStorageEngine.delFile(diff.destination.relativePath)
          this.logger.debug('sync.file.delete.completed', {
            ...context,
            storageType: this.destinationStorageType,
          })
        }
        if (diff.source) {
          this.logger.debug('sync.file.copy.started', {
            ...context,
            sourceType: this.sourceStorageType,
            destinationType: this.destinationStorageType,
          })
          await this.transfer(
            this.sourceStorageEngine,
            this.destinationStorageEngine,
            diff.source.relativePath,
          )
          this.logger.debug('sync.file.copy.completed', {
            ...context,
            sourceType: this.sourceStorageType,
            destinationType: this.destinationStorageType,
          })
        }
      }
    } catch (error) {
      this.logger.error('sync.file.failed', error, context)
      throw error
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

  /**
   * 清空状态
   */
  private clearStatus() {
    this.totalBytes = 0
    this.totalCount = 0
    this.ignoreCount = 0
    this.toLeftCount = 0
    this.toRightCount = 0
    this.bytesTransferred = 0
    this.transferredCount = 0
  }

  /**
   * 更新总体统计（通用记数函数）
   * @param newItem
   * @param oldItem
   */
  private updateTotals(newItem: FileDifference | null, oldItem: FileDifference | null) {
    // 先撤销 oldItem 的贡献（如果存在且是文件）
    if (oldItem && !oldItem.isDirectory) {
      // bytes
      const oldBytes = oldItem.transferBytes || 0
      this.totalBytes = this.clampNonNegative(this.totalBytes - oldBytes)

      // resolution counts
      switch (oldItem.resolution) {
        case 'toLeft':
          this.toLeftCount = this.clampNonNegative(this.toLeftCount - 1)
          break
        case 'toRight':
          this.toRightCount = this.clampNonNegative(this.toRightCount - 1)
          break
        case 'ignore':
          this.ignoreCount = this.clampNonNegative(this.ignoreCount - 1)
          break
        default:
          break
      }

      this.totalCount = this.clampNonNegative(this.totalCount - 1)
    }

    // 再应用 newItem 的贡献（如果存在且是文件）
    if (newItem && !newItem.isDirectory) {
      const newBytes = newItem.transferBytes || 0
      this.totalBytes += newBytes

      switch (newItem.resolution) {
        case 'toLeft':
          this.toLeftCount++
          break
        case 'toRight':
          this.toRightCount++
          break
        case 'ignore':
          this.ignoreCount++
          break
        default:
          break
      }

      this.totalCount++
    }
  }

  private clampNonNegative(n: number) {
    return n < 0 ? 0 : n
  }
}
