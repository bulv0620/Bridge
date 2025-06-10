const { Readable } = window.api.stream

/**
 * 文件元数据接口
 */
export interface FileMetaData {
  atime: Date
  mtime: Date
  mode: number
  size: number
}

/**
 * 文件信息接口
 */
export interface FileInfo {
  fileName: string
  size: number
  timestamp: Date
  filePath: string
  relativePath: string
  meta: FileMetaData
}

/**
 * 基础文件系统抽象类
 */
export abstract class FileSystem {
  protected basePath: string

  constructor(basePath: string = '') {
    this.basePath = basePath
  }

  protected abstract _resolve(filePath: string): string

  abstract validate(): Promise<boolean>
  abstract getAllFiles(dir?: string): Promise<FileInfo[]>
  abstract getFile(filePath: string): Promise<Buffer>
  abstract writeFile(filePath: string, data: Buffer | string): Promise<void>
  abstract delFile(filePath: string): Promise<void>
  abstract ensureDir(dirPath: string): Promise<void>
  abstract getMeta(filePath: string): Promise<FileMetaData>
  abstract setMeta(filePath: string, meta: FileMetaData): Promise<void>
  abstract getFileStream(filePath: string): Promise<InstanceType<typeof Readable>>
  abstract writeFileStream(filePath: string, source: InstanceType<typeof Readable>): Promise<void>
}
