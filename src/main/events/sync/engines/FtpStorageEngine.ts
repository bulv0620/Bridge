import type { Client, AccessOptions } from 'basic-ftp'
import ftp from 'basic-ftp'
import path from 'path'
import { shouldIgnoreFile, StorageEngine } from './StorageEngine'
import streamBuffers from 'stream-buffers'
import { PassThrough, Readable } from 'stream'
import { ReadStream, WriteStream } from 'fs'

/**
 * FTP 文件系统实现
 */
export class FtpStorageEngine extends StorageEngine {
  private client: Client
  private connected: boolean = false

  constructor(
    private config: AccessOptions,
    basePath: string = '/',
  ) {
    super(basePath)
    this.client = new ftp.Client()
    this.client.ftp.verbose = false
  }

  private async connect(): Promise<void> {
    if (!this.connected) {
      await this.client.access(this.config)
      this.connected = true
    }
  }

  async disconnect(): Promise<void> {
    this.client?.close()
    this.connected = false
  }

  protected _resolve(filePath: string): string {
    return path.posix.join(this.basePath, filePath.split(path.sep).join(path.posix.sep))
  }

  async validate(): Promise<boolean> {
    try {
      await this.client.access(this.config)
      this.connected = true
      return true
    } catch (err) {
      console.error('FTP connection failed:', err)
      this.connected = false
      return false
    }
  }

  async list(dir: string, ignoredFolders: string[]): Promise<FileInfo[]> {
    await this.connect()

    const filesList: FileInfo[] = []
    const resolvedDir = this._resolve(dir)
    const entries = await this.client.list(resolvedDir)

    for (const entry of entries) {
      if (shouldIgnoreFile(entry.name)) {
        continue
      }

      const fullPath = path.posix.join(resolvedDir, entry.name)

      if (entry.isDirectory) {
        if (ignoredFolders.includes(entry.name)) {
          continue
        }
      }

      filesList.push({
        isDirectory: entry.isDirectory,
        fileName: entry.name,
        size: entry.size,
        timestamp: new Date(entry.date),
        filePath: fullPath,
        relativePath: this.basePath ? path.posix.relative(this.basePath, fullPath) : entry.name,
        meta: {
          atime: new Date(entry.date),
          mtime: new Date(entry.date),
          mode: 0o644,
          size: entry.size,
        },
      })
    }

    filesList.sort((a, b) => {
      if (a.isDirectory === b.isDirectory) return 0
      return a.isDirectory ? -1 : 1
    })

    return filesList
  }

  async getAllFiles(dir: string, ignoredFolders: string[]): Promise<FileInfo[]> {
    await this.connect()
    let filesList: FileInfo[] = []
    const resolvedDir = this._resolve(dir)

    const entries = await this.client.list(resolvedDir)

    for (const item of entries) {
      const fullPath = path.posix.join(resolvedDir, item.name)

      if (shouldIgnoreFile(item.name)) {
        continue
      }
      if (item.isDirectory) {
        if (ignoredFolders.includes(item.name)) {
          continue
        }
        const subDir = path.posix.join(dir, item.name)
        const subFiles = await this.getAllFiles(subDir, ignoredFolders)
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
    await this.ensureDir(path.posix.dirname(filePath))
    const bufferData = Buffer.isBuffer(data) ? data : Buffer.from(data)
    const stream = Readable.from(bufferData)
    await this.client.uploadFrom(stream, resolvedPath)
    return
  }

  async createReadStream(filePath: string): Promise<ReadStream> {
    await this.connect()
    const resolved = this._resolve(filePath)

    const readStream = new PassThrough()

    this.client.downloadTo(readStream, resolved).catch((err) => {
      readStream.destroy(err)
      readStream.emit('error', err)
    })

    return readStream as unknown as ReadStream
  }

  async createWriteStream(filePath: string): Promise<WriteStream> {
    await this.connect()
    await this.ensureDir(path.posix.dirname(filePath))
    const resolved = this._resolve(filePath)

    const writeStream = new PassThrough()

    this.client.uploadFrom(writeStream, resolved).catch((err) => {
      writeStream.destroy(err)
      writeStream.emit('error', err)
    })

    return writeStream as unknown as WriteStream
  }

  async delFile(filePath: string): Promise<void> {
    await this.connect()
    const resolvedPath = this._resolve(filePath)
    await this.client.remove(resolvedPath)
    return
  }

  async exists(filePath: string) {
    await this.connect()
    const resolvedPath = this._resolve(filePath)
    try {
      await this.client.size(resolvedPath)
      return true
    } catch (err: any) {
      if (err.code === 550) {
        // 550 means file not found
        return false
      }
      throw err // rethrow other errors
    }
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
