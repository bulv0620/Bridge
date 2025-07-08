import { FileSystem, FileInfo, FileMetaData } from './FileSystem.adstract'
// 忽略文件列表，按平台区分
const IGNORE_FILES: Record<string, string[]> = {
  darwin: ['.DS_Store'],
  win32: ['desktop.ini'],
}

function shouldIgnoreFile(fileName: string): boolean {
  const platform = process.platform
  const ignoreList = IGNORE_FILES[platform] || []
  return ignoreList.includes(fileName)
}

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
      if (shouldIgnoreFile(entry.name)) {
        continue
      }
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
          isDirectory: entry.isDirectory(),
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

  async exists(filePath: string) {
    // 检查文件是否存在
    const resolvedPath = this._resolve(filePath)
    try {
      await fs.access(resolvedPath)
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
