import { FileSystem, FileInfo, FileMetaData } from './FileSystem.adstract'
import type { Client, AccessOptions } from 'basic-ftp'

const path = window.api.path
const ftp = window.api.ftp
const stream = window.api.stream
const { Readable } = stream
const streamBuffers = window.api.streamBuffers

/**
 * FTP 文件系统实现
 */
export class FtpFileSystem extends FileSystem {
  private client: Client
  private connected: boolean = false
  private folderWhitelist: string[]

  constructor(
    private config: AccessOptions,
    basePath: string = '',
    whiteList: string[] = [],
  ) {
    super(basePath)
    this.client = new ftp.Client()
    this.client.ftp.verbose = false
    this.folderWhitelist = whiteList
  }

  protected _resolve(filePath: string): string {
    return path.posix.join(this.basePath, filePath.split(path.sep).join(path.posix.sep))
  }

  getName() {
    return `${this.config.host}:${this.config.port}(${this.config.user})`
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
        if (this.folderWhitelist.includes(item.name)) {
          continue
        }

        const subDir = path.posix.join(dir, item.name)
        const subFiles = await this.getAllFiles(subDir)
        filesList = filesList.concat(subFiles)
      } else {
        filesList.push({
          isDirectory: item.isDirectory,
          fileName: item.name,
          size: item.size,
          timestamp: new Date(item.date),
          filePath: fullPath,
          relativePath: this.basePath ? path.posix.relative(this.basePath, fullPath) : item.name,
          meta: {
            atime: new Date(item.date),
            mtime: new Date(item.date),
            mode: 0o644,
            size: item.size,
          },
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

  async listDir(dir: string = '') {
    await this.connect()

    const filesList: FileInfo[] = []
    const resolvedDir = this._resolve(dir)
    const entries = await this.client.list(resolvedDir)

    for (const item of entries) {
      const fullPath = path.posix.join(resolvedDir, item.name)

      filesList.push({
        isDirectory: item.isDirectory,
        fileName: item.name,
        size: item.size,
        timestamp: new Date(item.date),
        filePath: fullPath,
        relativePath: this.basePath ? path.posix.relative(this.basePath, fullPath) : item.name,
        meta: {
          atime: new Date(item.date),
          mtime: new Date(item.date),
          mode: 0o644,
          size: item.size,
        },
      })
    }

    filesList.sort((a, b) => {
      if (a.isDirectory === b.isDirectory) return 0
      return a.isDirectory ? -1 : 1
    })

    return filesList
  }

  async getFiles(dirPath: string = '') {
    await this.connect()
    const resolvedPath = this._resolve(dirPath)
    const entries = await this.client.list(resolvedPath)
    return entries.filter((item) => !item.isDirectory).map((item) => item.name)
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

  async getFileStream(filePath: string): Promise<InstanceType<typeof Readable>> {
    await this.connect()
    const resolved = this._resolve(filePath)

    const pass = new stream.PassThrough()

    this.client.downloadTo(pass, resolved).catch((err) => pass.destroy(err))
    return pass
  }

  async writeFileStream(filePath: string, source: InstanceType<typeof Readable>): Promise<void> {
    await this.connect()
    await this.ensureDir(path.dirname(filePath))
    const resolved = this._resolve(filePath)

    await this.client.uploadFrom(source, resolved)
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
      date.getFullYear().toString() +
      pad(date.getMonth() + 1) +
      pad(date.getDate()) +
      pad(date.getHours()) +
      pad(date.getMinutes()) +
      pad(date.getSeconds()) +
      '.' +
      date.getMilliseconds().toString().padStart(3, '0')
    )
  }
}
