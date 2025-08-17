import { Transform } from 'stream'
import { pipeline } from 'stream/promises'
import { FtpStorageEngine } from './storage-engine/FtpStorageEngine'
import { LocalStorageEngine } from './storage-engine/LocalStorageEngine'
import { StorageEngine } from './storage-engine/StorageEngine'

export class SyncManager {
  private sourceConfig: StorageEngineConfig | null
  private sourceStorageEngine: StorageEngine | null
  private destinationConfig: StorageEngineConfig | null
  private destinationStorageEngine: StorageEngine | null
  private ignoredFolders: string[]

  constructor() {
    this.sourceConfig = null
    this.sourceStorageEngine = null
    this.destinationConfig = null
    this.destinationStorageEngine = null
    this.ignoredFolders = []
  }

  setStorageEngineConfig(type: 'source' | 'destination', config: StorageEngineConfig) {
    if (type === 'source') {
      this.sourceConfig = config
    } else {
      this.destinationConfig = config
    }
  }

  setIgnoredFolders(folders: string[]) {
    this.ignoredFolders = folders
  }

  createStorageEngineInstance(config: StorageEngineConfig): StorageEngine {
    if (config.storageType === 'ftp') {
      return new FtpStorageEngine(config.connectionConfig!, config.path, this.ignoredFolders)
    } else {
      return new LocalStorageEngine(config.path, this.ignoredFolders)
    }
  }

  async transfer(sourceFilePath: string, destinationFilePath: string) {
    if (!this.sourceConfig || !this.destinationConfig) {
      return
    }
    if (!this.sourceStorageEngine) {
      this.sourceStorageEngine = this.createStorageEngineInstance(this.sourceConfig)
    }

    if (!this.destinationStorageEngine) {
      this.destinationStorageEngine = this.createStorageEngineInstance(this.destinationConfig)
    }

    const readStream = await this.sourceStorageEngine.createReadStream(sourceFilePath)
    const writeStream = await this.destinationStorageEngine.createWriteStream(destinationFilePath)

    // 传输统计变量
    let transferredBytes = 0
    const startTime = Date.now()
    let lastCheckTime = startTime
    let lastTransferredBytes = 0

    // 创建传输监控流
    const monitorStream = new Transform({
      transform(chunk, _, callback) {
        transferredBytes += chunk.length
        callback(null, chunk)
      },
    })

    const progressInterval = setInterval(() => {
      const now = Date.now()
      const timeDiff = (now - lastCheckTime) / 1000 // 秒
      const transferredDiff = transferredBytes - lastTransferredBytes

      // 计算当前速度
      const currentSpeed = transferredDiff / timeDiff // 字节/秒

      let speedText: string
      if (currentSpeed > 1024 * 1024) {
        speedText = (currentSpeed / (1024 * 1024)).toFixed(2) + ' MB/s'
      } else if (currentSpeed > 1024) {
        speedText = (currentSpeed / 1024).toFixed(2) + ' KB/s'
      } else {
        speedText = currentSpeed.toFixed(2) + ' B/s'
      }

      console.log(`已传输: ${transferredBytes} 字节 | 速度: ${speedText}`)

      lastCheckTime = now
      lastTransferredBytes = transferredBytes
    }, 1000)

    try {
      await pipeline(readStream, monitorStream, writeStream)

      const totalTime = (Date.now() - startTime) / 1000
      const averageSpeed = transferredBytes / totalTime

      console.log(
        `传输完成! 总字节: ${transferredBytes} | 总时间: ${totalTime.toFixed(2)} 秒 | 平均速度: ${(averageSpeed / 1024).toFixed(2)} KB/s`,
      )
    } catch (err) {
      console.error('传输失败:', err)
      throw err
    } finally {
      // 清除定时器
      clearInterval(progressInterval)

      // 确保流被正确关闭
      if (!readStream.destroyed) readStream.destroy()
      if (!writeStream.destroyed) writeStream.destroy()
    }
  }
}
