const { Readable } = window.api.stream

// 通用存储位置信息
declare interface StorageEndpoint {
  storageType: 'local' | 'ftp' | ''
  path: string
  connectionConfig?: FtpConfig
}

// ftp配置信息
declare interface FtpConfig {
  host: string
  port: number
  user: string
  password: string
  secure: boolean
  secureOptions: {
    rejectUnauthorized: boolean
  }
}

/**
 * 同步策略类型
 * - incremental: 增量同步（仅同步变化的文件）
 * - bidirectional: 双向同步（冲突时提示用户选择）
 * - mirror: 镜像同步（强制目标端与源端完全一致）
 */
declare type SyncStrategy = 'incremental' | 'bidirectional' | 'mirror'

// 同步方案
declare interface FileSyncPlan {
  id?: string
  name: string
  sourceEndpoint: StorageEndpoint | null // 源
  destinationEndpoint: StorageEndpoint | null // 目标
  ignoredFolders: string[] // 忽略文件夹
  syncStrategy: SyncStrategy // 同步策略
}

// 文件元数据接口
declare interface FileMetaData {
  atime: Date
  mtime: Date
  mode: number
  size: number
}

// 文件信息接口
declare interface FileInfo {
  key?: string
  fileName: string
  size: number
  timestamp: Date
  filePath: string
  relativePath: string
  meta?: FileMetaData
  isDirectory: boolean
}

// 差异项目信息
declare interface FileDifference {
  id: string
  fileName: string
  isDirectory: boolean // 是否为目录
  difference: 'onlySource' | 'onlyTarget' | 'conflict' // 差异类型
  resolution: 'toLeft' | 'toRight' | 'ignore' // 操作
  source?: FileInfo | null // 源文件信息
  target?: FileInfo | null // 目标文件信息
  children?: FileDifference[] // 子项
}

// 文件系统抽象类
declare abstract class FileSystem {
  protected basePath: string
  constructor(basePath: string = '') {
    this.basePath = basePath
  }
  protected abstract _resolve(filePath: string): string
  abstract validate(): Promise<boolean>
  abstract getAllFiles(dir?: string): Promise<FileInfo[]>
  abstract getFile(filePath: string): Promise<Buffer>
  abstract writeFile(filePath: string, data: Buffer | string): Promise<void>
  abstract getFileStream(filePath: string): Promise<InstanceType<typeof Readable>>
  abstract writeFileStream(filePath: string, source: InstanceType<typeof Readable>): Promise<void>
  abstract delFile(filePath: string): Promise<void>
  abstract exists(filePath: string): Promise<boolean>
  abstract ensureDir(dirPath: string): Promise<void>
  abstract getMeta(filePath: string): Promise<FileMetaData>
  abstract setMeta(filePath: string, meta: FileMetaData): Promise<void>
}
