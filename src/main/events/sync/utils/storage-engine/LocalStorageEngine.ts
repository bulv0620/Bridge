import { ReadStream, WriteStream } from 'fs'
import { shouldIgnoreFile, StorageEngine } from './StorageEngine'
import path from 'path'
import fs from 'fs'

/**
 * 本地文件系统实现
 */
export class LocalStorageEngine extends StorageEngine {
  constructor(basePath: string = '', ignoredFolders: string[] = []) {
    super(basePath, ignoredFolders)
  }

  protected _resolve(filePath: string): string {
    return path.join(this.basePath, filePath)
  }

  async validate(): Promise<boolean> {
    try {
      await fs.promises.access(this.basePath)
      return true
    } catch (err) {
      console.error('Base path does not exist:', this.basePath, err)
      return false
    }
  }

  async list(dir: string = ''): Promise<FileInfo[]> {
    const resolvedDir = this._resolve(dir)
    const entries = await fs.promises.readdir(resolvedDir, { withFileTypes: true })
    const fileList: FileInfo[] = []

    for (const entry of entries) {
      if (shouldIgnoreFile(entry.name)) {
        continue
      }

      const fullPath = path.join(resolvedDir, entry.name)

      if (entry.isDirectory()) {
        if (this.ignoredFolders.includes(entry.name)) {
          continue
        }
      }

      const stats = await fs.promises.stat(fullPath)
      fileList.push({
        fileName: entry.name,
        size: stats.size,
        timestamp: stats.mtime,
        filePath: fullPath,
        relativePath: path.relative(this.basePath, fullPath),
        meta: {
          atime: stats.atime,
          mtime: stats.mtime,
          mode: stats.mode,
          size: stats.size,
        },
        isDirectory: entry.isDirectory(),
      })
    }

    return fileList
  }

  async getAllFiles(dir: string = ''): Promise<FileInfo[]> {
    let fileList: FileInfo[] = []
    const resolvedDir = this._resolve(dir)
    const entries = await fs.promises.readdir(resolvedDir, { withFileTypes: true })

    for (const entry of entries) {
      if (shouldIgnoreFile(entry.name)) {
        continue
      }
      const fullPath = path.join(resolvedDir, entry.name)

      if (entry.isDirectory()) {
        if (this.ignoredFolders.includes(entry.name)) {
          continue
        }

        const subDir = path.join(dir, entry.name)
        const subFiles = await this.getAllFiles(subDir)
        fileList = fileList.concat(subFiles)
      } else if (entry.isFile()) {
        const stats = await fs.promises.stat(fullPath)
        fileList.push({
          fileName: entry.name,
          size: stats.size,
          timestamp: stats.mtime,
          filePath: fullPath,
          relativePath: path.relative(this.basePath, fullPath),
          meta: {
            atime: stats.atime,
            mtime: stats.mtime,
            mode: stats.mode,
            size: stats.size,
          },
          isDirectory: entry.isDirectory(),
        })
      }
    }
    return fileList
  }

  async getFile(filePath: string): Promise<Buffer> {
    const resolvedPath = this._resolve(filePath)
    return fs.promises.readFile(resolvedPath)
  }

  async writeFile(filePath: string, data: Buffer | string): Promise<void> {
    const resolvedPath = this._resolve(filePath)
    await this.ensureDir(path.dirname(filePath))
    return fs.promises.writeFile(resolvedPath, data)
  }

  async createReadStream(filePath: string): Promise<ReadStream> {
    const resolved = this._resolve(filePath)
    return fs.createReadStream(resolved)
  }

  async createWriteStream(filePath: string): Promise<WriteStream> {
    await this.ensureDir(path.dirname(filePath))
    const resolved = this._resolve(filePath)
    return fs.createWriteStream(resolved)
  }

  async delFile(filePath: string): Promise<void> {
    const resolvedPath = this._resolve(filePath)
    return fs.promises.unlink(resolvedPath)
  }

  async exists(filePath: string) {
    // 检查文件是否存在
    const resolvedPath = this._resolve(filePath)
    try {
      await fs.promises.access(resolvedPath)
      return true
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return false // 文件不存在
      }
      throw err // 其他错误抛出
    }
  }

  async ensureDir(dirPath: string): Promise<void> {
    const resolvedPath = this._resolve(dirPath)
    await fs.promises.mkdir(resolvedPath, { recursive: true })
    return
  }

  async getMeta(filePath: string): Promise<FileMetaData> {
    const resolvedPath = this._resolve(filePath)
    const stats = await fs.promises.stat(resolvedPath)
    return {
      atime: stats.atime,
      mtime: stats.mtime,
      mode: stats.mode,
      size: stats.size,
    }
  }

  async setMeta(filePath: string, meta: FileMetaData): Promise<void> {
    const resolvedPath = this._resolve(filePath)
    await fs.promises.utimes(resolvedPath, meta.atime, meta.mtime)
    await fs.promises.chmod(resolvedPath, meta.mode)
  }
}
