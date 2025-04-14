import { FileSystem, FileInfo, FileMetaData } from './FileSystem.adstract'

const fs = window.api.fs
const path = window.api.path
// 定义白名单目录名称数组
const folderWhitelist = ['']

/**
 * 本地文件系统实现
 */
export class LocalFileSystem extends FileSystem {
  constructor(basePath: string = '') {
    super(basePath)
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
        if (folderWhitelist.includes(entry.name)) {
          const subEntries = await fs.readdir(fullPath, { withFileTypes: true })
          for (const subEntry of subEntries) {
            if (subEntry.isFile()) {
              const subFullPath = path.join(fullPath, subEntry.name)
              const stats = await fs.stat(subFullPath)
              filesList.push({
                fileName: subEntry.name,
                size: stats.size,
                timestamp: stats.mtime,
                filePath: subFullPath,
                relativePath: path.relative(this.basePath, subFullPath),
              })
            }
          }
        } else {
          const subDir = path.join(dir, entry.name)
          const subFiles = await this.getAllFiles(subDir)
          filesList = filesList.concat(subFiles)
        }
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath)
        filesList.push({
          fileName: entry.name,
          size: stats.size,
          timestamp: stats.mtime,
          filePath: fullPath,
          relativePath: path.relative(this.basePath, fullPath),
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
