import { ReadStream, WriteStream } from 'fs'

// 存储系统抽象类
export abstract class StorageEngine {
  protected basePath: string
  constructor(basePath: string = '') {
    this.basePath = basePath
  }
  protected abstract _resolve(filePath: string): string
  abstract validate(): Promise<boolean>
  abstract list(dir: string, ignoredFolders: string[]): Promise<FileInfo[]>
  abstract getAllFiles(dir: string, ignoredFolders: string[]): Promise<FileInfo[]>
  abstract getFile(filePath: string): Promise<Buffer>
  abstract writeFile(filePath: string, data: Buffer | string): Promise<void>
  abstract createReadStream(filePath: string): Promise<ReadStream>
  abstract createWriteStream(filePath: string): Promise<WriteStream>
  abstract delFile(filePath: string): Promise<void>
  abstract exists(filePath: string): Promise<boolean>
  abstract ensureDir(dirPath: string): Promise<void>
  abstract getMeta(filePath: string): Promise<FileMetaData>
  abstract setMeta(filePath: string, meta: FileMetaData): Promise<void>
}

// 忽略文件列表，按平台区分
export const IGNORE_FILES: Record<string, string[]> = {
  darwin: ['.DS_Store'],
  win32: ['desktop.ini'],
}

export function shouldIgnoreFile(fileName: string): boolean {
  const platform = process.platform
  const ignoreList = IGNORE_FILES[platform] || []
  return !!ignoreList.find((f) => fileName.includes(f))
}
