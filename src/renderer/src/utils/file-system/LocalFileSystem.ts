import { FileSystem, FileInfo, FileMetaData } from './FileSystem.adstract'

const { Readable } = window.api.stream
const fs = window.api.fs
const fsSync = window.api.fsSync
const path = window.api.path

/**
 * 本地文件系统实现
 */
export class LocalFileSystem extends FileSystem {
  private folderWhitelist: string[]

  constructor(basePath: string = '', whiteList: string[] = []) {
    super(basePath)
    this.folderWhitelist = whiteList
  }

  protected _resolve(filePath: string): string {
    return path.join(this.basePath, filePath)
  }

  async validate(): Promise<boolean> {
    try {
      await fs.access(this.basePath)
      return true
    } catch (err) {
      console.error('Base path does not exist:', this.basePath, err)
      return false
    }
  }

  async getAllFiles(dir: string = ''): Promise<FileInfo[]> {
    let filesList: FileInfo[] = []
    const resolvedDir = this._resolve(dir)
    const entries = await fs.readdir(resolvedDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(resolvedDir, entry.name)

      if (entry.isDirectory()) {
        if (this.folderWhitelist.includes(entry.name)) {
          continue
        }

        const subDir = path.join(dir, entry.name)
        const subFiles = await this.getAllFiles(subDir)
        filesList = filesList.concat(subFiles)
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath)
        filesList.push({
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
        })
      }
    }
    return filesList
  }

  async getFile(filePath: string): Promise<Buffer> {
    const resolvedPath = this._resolve(filePath)
    return fs.readFile(resolvedPath)
  }

  async writeFile(filePath: string, data: Buffer | string): Promise<void> {
    const resolvedPath = this._resolve(filePath)
    await this.ensureDir(path.dirname(filePath))
    return fs.writeFile(resolvedPath, data)
  }

  async getFileStream(filePath: string): Promise<InstanceType<typeof Readable>> {
    const resolved = this._resolve(filePath)
    return fsSync.createReadStream(resolved)
  }

  async writeFileStream(filePath: string, source: InstanceType<typeof Readable>): Promise<void> {
    await this.ensureDir(path.dirname(filePath))
    const resolved = this._resolve(filePath)
    const dest = fsSync.createWriteStream(resolved)
    await new Promise<void>((resolve, reject) => {
      source.pipe(dest).on('finish', resolve).on('error', reject)
    })
  }

  async delFile(filePath: string): Promise<void> {
    const resolvedPath = this._resolve(filePath)
    return fs.unlink(resolvedPath)
  }

  async ensureDir(dirPath: string): Promise<void> {
    const resolvedPath = this._resolve(dirPath)
    await fs.mkdir(resolvedPath, { recursive: true })
    return
  }

  async getMeta(filePath: string): Promise<FileMetaData> {
    const resolvedPath = this._resolve(filePath)
    const stats = await fs.stat(resolvedPath)
    return {
      atime: stats.atime,
      mtime: stats.mtime,
      mode: stats.mode,
      size: stats.size,
    }
  }

  async setMeta(filePath: string, meta: FileMetaData): Promise<void> {
    const resolvedPath = this._resolve(filePath)
    await fs.utimes(resolvedPath, meta.atime, meta.mtime)
    await fs.chmod(resolvedPath, meta.mode)
  }
}
