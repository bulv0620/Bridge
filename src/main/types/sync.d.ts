const { Readable } = window.api.stream

declare interface SyncFolderInfo {
  type: 'local' | 'ftp' | ''
  path: string
  ftpConfig?: FtpConfig
}

declare interface FtpConfig {
  host: string
  port: number
  user: string
  password: string
}

declare interface SyncPlanInfo {
  planId: string
  planName: string
  sourceFolder: FolderInfo
  targetFolder: FolderInfo
  folderWhiteList: string[]
  syncType: ESyncType
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
  meta: FileMetaData
  isDirectory: boolean
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
