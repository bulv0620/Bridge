import { ReadStream, WriteStream } from 'fs'
import { shouldIgnoreFile, StorageEngine } from '../StorageEngine'
import path from 'path'
import fs from 'fs'
import { exec as execCb } from 'child_process'
import util from 'util'
const exec = util.promisify(execCb)

/**
 * 本地文件系统实现
 */
export class LocalStorageEngine extends StorageEngine {
  constructor(basePath: string = '') {
    super(basePath)
  }

  async disconnect(): Promise<void> {}

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

  async list(dir: string, ignoredFolders: string[]): Promise<FileInfo[]> {
    const resolvedDir = this._resolve(dir)
    const entries = await fs.promises.readdir(resolvedDir, { withFileTypes: true })
    const fileList: FileInfo[] = []

    for (const entry of entries) {
      if (shouldIgnoreFile(entry.name)) {
        continue
      }

      const fullPath = path.join(resolvedDir, entry.name)

      if (entry.isDirectory()) {
        if (ignoredFolders.includes(entry.name)) {
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

  async getAllFiles(dir: string, ignoredFolders: string[]): Promise<FileInfo[]> {
    let fileList: FileInfo[] = []
    const resolvedDir = this._resolve(dir)
    const entries = await fs.promises.readdir(resolvedDir, { withFileTypes: true })

    for (const entry of entries) {
      if (shouldIgnoreFile(entry.name)) {
        continue
      }
      const fullPath = path.join(resolvedDir, entry.name)

      if (entry.isDirectory()) {
        if (ignoredFolders.includes(entry.name)) {
          continue
        }

        const subDir = path.join(dir, entry.name)
        const subFiles = await this.getAllFiles(subDir, ignoredFolders)
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

  async getCapacity(): Promise<StorageCapacity | undefined> {
    try {
      // 以 basePath 为目标挂载点 / 驱动器；当 basePath 为空时使用当前工作目录
      const targetPath = this.basePath && this.basePath !== '' ? this.basePath : process.cwd()
      if (process.platform === 'win32') {
        // Windows: 找到驱动盘符，例如 C:
        const root = path.parse(targetPath).root // like 'C:\\'
        const drive = root.replace(/\\+$/, '') // -> 'C:'
        if (!drive) return undefined

        // 使用 wmic 查询（在部分新版 Windows 可能不可用）
        const cmd = `wmic logicaldisk where "DeviceID='${drive}'" get Size,FreeSpace /format:list`
        const { stdout } = await exec(cmd)
        // stdout 形如:
        // FreeSpace=123456789
        // Size=234567890
        // \r\n
        const lines = String(stdout)
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
        const map: Record<string, string> = {}
        for (const line of lines) {
          const idx = line.indexOf('=')
          if (idx > -1) {
            const k = line.slice(0, idx)
            const v = line.slice(idx + 1)
            map[k] = v
          }
        }
        const free = map.FreeSpace ? parseInt(map.FreeSpace, 10) : NaN
        const total = map.Size ? parseInt(map.Size, 10) : NaN
        if (isNaN(total) || isNaN(free)) return undefined
        const used = total - free
        return { total, used }
      } else {
        // Unix-like: 使用 df -k 获取基于 targetPath 的文件系统
        // df 输出的块单位为 1K-blocks，乘以 1024 得到字节
        const cmd = `df -k "${targetPath}"`
        const { stdout } = await exec(cmd)
        const lines = String(stdout).trim().split(/\r?\n/)
        if (lines.length < 2) return undefined
        // 第二行通常包含数据：Filesystem 1K-blocks Used Available Use% Mounted on
        // 解析时用正则分割空白
        const parts = lines[1].trim().split(/\s+/)
        // 在某些系统上输出可能折行，尝试找到一行包含数字块
        let dataParts = parts
        if (parts.length < 4) {
          // 找到第一行包含 1K-blocks 的行之后的下一行（防护性处理）
          for (let i = 2; i < lines.length; i++) {
            const p = lines[i].trim().split(/\s+/)
            if (p.length >= 4) {
              dataParts = p
              break
            }
          }
        }
        if (dataParts.length < 4) return undefined
        const totalK = parseInt(dataParts[1], 10)
        const usedK = parseInt(dataParts[2], 10)
        const availK = parseInt(dataParts[3], 10)
        if (isNaN(totalK) || isNaN(usedK) || isNaN(availK)) return undefined
        const total = totalK * 1024
        const used = usedK * 1024
        return { total, used }
      }
    } catch (err) {
      // 出错时返回 undefined（调用方可以决定是否降级处理）
      // 可以根据需要把错误打印出来
      // console.error('getCapacity error:', err)
      return
    }
  }
}
