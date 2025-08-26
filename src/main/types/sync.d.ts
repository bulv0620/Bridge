/**
 * 存储类型
 * - ftp: FTP/FTPS服务目录
 * - local: 本地存储目录
 */
declare type StorageType = 'ftp' | 'local' | ''

// 通用存储位置信息
declare interface StorageEngineConfig {
  storageType: StorageType
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
  timestamp?: number
  name: string
  sourceConfig: StorageEngineConfig | null // 源
  destinationConfig: StorageEngineConfig | null // 目标
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

declare type FileSyncResolition = 'toLeft' | 'toRight' | 'ignore' | ''

// 差异项目信息
declare interface FileDifference {
  id: string
  parentId: string | null
  fileName: string
  isDirectory: boolean // 是否为目录
  difference: 'onlySource' | 'onlyDest' | 'conflict' | '' // 差异类型
  resolution: FileSyncResolition // 操作
  source: FileInfo | null // 源文件信息
  destination: FileInfo | null // 目标文件信息
  transferBytes: number // 传输的数据量
}

declare interface CompareResult {
  totalBytes: number
  totalCount: number
}

declare interface SyncStatus {
  bytesTransferred: number
  transferredCount: number
}
