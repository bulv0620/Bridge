import { FileSystem, FileInfo, FileMetaData } from './FileSystem.adstract'
import type { Client, AccessOptions } from 'basic-ftp'
const path = window.api.path
const ftp = window.api.ftp
const Readable = window.api.Readable
const streamBuffers = window.api.streamBuffers

// 定义白名单目录名称数组
const folderWhitelist = ['']

/**
 * FTP 文件系统实现
 */
export class FtpFileSystem extends FileSystem {
  private client: Client
  private connected: boolean = false

  constructor(
    private config: AccessOptions,
    basePath: string = '',
  ) {
    super(basePath)
    this.client = new ftp.Client()
    this.client.ftp.verbose = false
  }

  protected _resolve(filePath: string): string {
    return path.posix.join(this.basePath, filePath.split(path.sep).join(path.posix.sep))
  }

  async validate(): Promise<boolean> {
    try {
      await this.client.access(this.config)
      this.connected = true
      await this.disconnect()
      return true
    } catch (err) {
      console.error('FTP connection failed:', err)
      this.connected = false
      return false
    }
  }

  private async connect(): Promise<void> {
    if (!this.connected) {
      await this.client.access(this.config)
      this.connected = true
    }
  }

  async disconnect(): Promise<void> {
    await this.client?.close()
    this.connected = false
  }

  async getAllFiles(dir: string = ''): Promise<FileInfo[]> {
    await this.connect()
    let filesList: FileInfo[] = []
    const resolvedDir = this._resolve(dir)
    const entries = await this.client.list(resolvedDir)

    for (const item of entries) {
      const fullPath = path.posix.join(resolvedDir, item.name)

      if (item.isDirectory) {
        if (folderWhitelist.includes(item.name)) {
          const subEntries = await this.client.list(fullPath)
          for (const subItem of subEntries) {
            if (!subItem.isDirectory) {
              const subFullPath = path.posix.join(fullPath, subItem.name)
              filesList.push({
                fileName: subItem.name,
                size: subItem.size,
                timestamp: new Date(subItem.date),
                filePath: subFullPath,
                relativePath: this.basePath
                  ? path.posix.relative(this.basePath, subFullPath)
                  : subItem.name,
              })
            }
          }
        } else {
          const subDir = path.posix.join(dir, item.name)
          const subFiles = await this.getAllFiles(subDir)
          filesList = filesList.concat(subFiles)
        }
      } else {
        filesList.push({
          fileName: item.name,
          size: item.size,
          timestamp: new Date(item.date),
          filePath: fullPath,
          relativePath: this.basePath ? path.posix.relative(this.basePath, fullPath) : item.name,
        })
      }
    }
    return filesList
  }

  async getFolder(dirPath: string = '') {
    await this.connect()
    const resolvedPath = this._resolve(dirPath)
    const entries = await this.client.list(resolvedPath)
    return entries
      .filter((item) => item.name !== '.' && item.name !== '..' && item.isDirectory)
      .map((item) => item.name)
  }

  async getFile(filePath: string): Promise<Buffer> {
    await this.connect()
    const resolvedPath = this._resolve(filePath)
    const writableBuffer = new streamBuffers.WritableStreamBuffer()
    await this.client.downloadTo(writableBuffer, resolvedPath)
    const fileBuffer = writableBuffer.getContents()
    if (!fileBuffer) throw new Error('Failed to download file')
    return fileBuffer
  }

  async writeFile(filePath: string, data: Buffer | string): Promise<void> {
    await this.connect()
    const resolvedPath = this._resolve(filePath)
    await this.ensureDir(path.dirname(filePath))
    const bufferData = Buffer.isBuffer(data) ? data : Buffer.from(data)
    const stream = Readable.from(bufferData)
    await this.client.uploadFrom(stream, resolvedPath)
    return
  }

  async delFile(filePath: string): Promise<void> {
    await this.connect()
    const resolvedPath = this._resolve(filePath)
    await this.client.remove(resolvedPath)
    return
  }

  async ensureDir(dirPath: string): Promise<void> {
    await this.connect()
    const resolvedPath = this._resolve(dirPath)
    return this.client.ensureDir(resolvedPath)
  }

  async getMeta(filePath: string): Promise<FileMetaData> {
    await this.connect()
    const resolvedPath = this._resolve(filePath)
    const dirname = path.posix.dirname(resolvedPath)
    const list = await this.client.list(dirname)
    const target = list.find((item) => item.name === path.posix.basename(resolvedPath))
    if (target) {
      return {
        mtime: new Date(target.date),
        atime: new Date(target.date),
        mode: 0o644,
        size: target.size,
      }
    } else {
      throw new Error(`FTP file not found: ${resolvedPath}`)
    }
  }

  async setMeta(filePath: string, meta: FileMetaData): Promise<void> {
    await this.connect()
    const resolvedPath = this._resolve(filePath)
    try {
      const mtimeStr = this.formatDateForMFMT(meta.mtime)
      await this.client.send(`MFMT ${mtimeStr} ${resolvedPath}`)
    } catch (e) {
      console.warn('Failed to set FTP file time:', e)
    }
  }

  private formatDateForMFMT(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0')
    return (
      date.getUTCFullYear().toString() +
      pad(date.getUTCMonth() + 1) +
      pad(date.getUTCDate()) +
      pad(date.getUTCHours()) +
      pad(date.getUTCMinutes()) +
      pad(date.getUTCSeconds()) +
      '.' +
      date.getUTCMilliseconds().toString().padStart(3, '0')
    )
  }
}
