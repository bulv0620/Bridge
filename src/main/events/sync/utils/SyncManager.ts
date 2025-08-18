import { pipeline } from 'stream/promises'
import { FtpStorageEngine } from './storage-engine/FtpStorageEngine'
import { LocalStorageEngine } from './storage-engine/LocalStorageEngine'
import { StorageEngine } from './storage-engine/StorageEngine'

// 构建目录树结构
interface TreeNode {
  name: string
  key: string
  isDirectory: boolean
  children: Map<string, TreeNode>
}

export class SyncManager {
  private sourceConfig: StorageEngineConfig | null
  private sourceStorageEngine: StorageEngine | null
  private destinationConfig: StorageEngineConfig | null
  private destinationStorageEngine: StorageEngine | null
  private ignoredFolders: string[]
  private syncStrategy: SyncStrategy

  constructor() {
    this.sourceConfig = null
    this.sourceStorageEngine = null
    this.destinationConfig = null
    this.destinationStorageEngine = null
    this.ignoredFolders = []
  }

  /**
   * 设置存储引擎配置
   * @param type
   * @param config
   */
  setStorageEngineConfig(type: 'source' | 'destination', config: StorageEngineConfig) {
    if (type === 'source') {
      this.sourceConfig = config
      this.sourceStorageEngine = this.createStorageEngineInstance(this.sourceConfig)
    } else {
      this.destinationConfig = config
      this.destinationStorageEngine = this.createStorageEngineInstance(this.destinationConfig)
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
  async diff(): Promise<FileDifference[]> {
    if (!this.sourceStorageEngine || !this.destinationStorageEngine) {
      throw new Error('Source and destination storage engines must be configured')
    }

    const sourceFiles = await this.sourceStorageEngine.list('', this.ignoredFolders)
    const destinationFiles = await this.destinationStorageEngine.list('', this.ignoredFolders)

    // key = type + relativePath，文件夹前缀 'D:', 文件前缀 'F:'
    const mapByPath = (files: FileInfo[]) => {
      const map = new Map<string, FileInfo>()
      files.forEach((file) => {
        const key = (file.isDirectory ? 'D:' : 'F:') + file.relativePath
        map.set(key, file)
      })
      return map
    }

    const sourceMap = mapByPath(sourceFiles)
    const destinationMap = mapByPath(destinationFiles)

    const buildTree = (files: FileInfo[]) => {
      const root: TreeNode = { name: '', key: '', isDirectory: true, children: new Map() }

      for (const file of files) {
        const parts = file.relativePath.split('/')
        let current = root
        for (let i = 0; i < parts.length; i++) {
          const isDir = i < parts.length - 1 || file.isDirectory
          const key = (isDir ? 'D:' : 'F:') + parts.slice(0, i + 1).join('/')
          if (!current.children.has(key)) {
            current.children.set(key, {
              name: parts[i],
              key,
              isDirectory: isDir,
              children: new Map(),
            })
          }
          current = current.children.get(key)!
        }
      }

      return root
    }

    const sourceTree = buildTree(sourceFiles)
    const destinationTree = buildTree(destinationFiles)

    const diffNode = (
      key: string,
      sourceNode?: TreeNode,
      destNode?: TreeNode,
    ): FileDifference | null => {
      const sourceFile = sourceNode ? sourceMap.get(sourceNode.key) || null : null
      const destFile = destNode ? destinationMap.get(destNode.key) || null : null

      let difference: FileDifference['difference']
      if (sourceFile && !destFile) {
        difference = 'onlySource'
      } else if (!sourceFile && destFile) {
        difference = 'onlyTarget'
      } else if (sourceFile && destFile) {
        if (
          sourceFile.isDirectory !== destFile.isDirectory ||
          (!sourceFile.isDirectory && sourceFile.size !== destFile.size)
        ) {
          difference = 'conflict'
        } else {
          difference = ''
        }
      } else {
        return null
      }

      const childrenKeys = new Set<string>([
        ...(sourceNode ? Array.from(sourceNode.children.keys()) : []),
        ...(destNode ? Array.from(destNode.children.keys()) : []),
      ])

      const children: FileDifference[] = []
      for (const childKey of childrenKeys) {
        const childDiff = diffNode(
          childKey,
          sourceNode?.children.get(childKey),
          destNode?.children.get(childKey),
        )
        if (childDiff) children.push(childDiff)
      }

      return {
        id: key,
        fileName: sourceNode?.name || destNode!.name,
        isDirectory: sourceNode?.isDirectory ?? destNode!.isDirectory,
        difference,
        resolution: 'ignore',
        source: sourceFile,
        destination: destFile,
        children: children.length ? children : undefined,
      }
    }

    const allRootKeys = new Set<string>([
      ...Array.from(sourceTree.children.keys()),
      ...Array.from(destinationTree.children.keys()),
    ])

    const diffs: FileDifference[] = []
    for (const rootKey of allRootKeys) {
      const nodeDiff = diffNode(
        rootKey,
        sourceTree.children.get(rootKey),
        destinationTree.children.get(rootKey),
      )
      if (nodeDiff && nodeDiff.difference !== '') diffs.push(nodeDiff)
    }

    return diffs
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
