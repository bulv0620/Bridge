import express, { Express, Request, Response } from 'express'
import { Server } from 'http'
import fs from 'fs'
import path from 'path'
import { remoteRef, RemoteRefMain } from '../../../utils/remoteRef'

export interface FileServerOptions {
  port?: number
  interval?: number
}

export interface FileItem {
  id: string
  filePath: string
  [key: string]: any
}

export class FileServer {
  private readonly port: number
  private readonly mySharedFileList: RemoteRefMain<SharedFileInfo[]>
  private readonly app: Express
  private server: Server | null = null
  private timer: NodeJS.Timeout | null = null
  private interval: number

  constructor(options: FileServerOptions = {}) {
    this.mySharedFileList = remoteRef('shared-file-list', [])

    this.port = options.port ?? 9520
    this.interval = options.interval ?? 1000

    this.app = express()

    this.app.get('/download/:id', this.handleDownload.bind(this))
    this.app.get('/list', this.handleQuery.bind(this))
  }

  /** 启动服务器 */
  public start(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        console.log('⚠️ HTTP server already started')
        resolve()
        return
      }

      this.timer = setInterval(() => {
        this.mySharedFileList.value = this.mySharedFileList.value.filter(
          (file) => file.status.expiresAt! > Date.now(),
        )
      }, this.interval)

      this.server = this.app.listen(this.port, () => {
        console.log(`✅ HTTP server listening on port ${this.port}`)
        resolve()
      })
    })
  }

  /** 关闭服务器 */
  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        console.log('⚠️ HTTP server is not running')
        resolve()
        return
      }

      if (this.timer) clearInterval(this.timer)
      this.timer = null
      this.mySharedFileList.value = [] // 清空共享文件列表

      this.server.close((err?: Error) => {
        if (err) return reject(err)
        console.log('🛑 HTTP server stopped')
        this.server = null
        resolve()
      })
    })
  }

  /** 重启服务器 */
  public async restart(): Promise<void> {
    await this.stop().catch((err) => {
      console.warn('⚠️ Error stopping HTTP server:', err)
      // 即使 stop 失败，也尝试启动
    })
    await this.start()
    console.log('🔁 HTTP server restarted')
  }

  /** 下载处理 */
  private async handleDownload(req: Request<{ id: string }>, res: Response) {
    const fileId = req.params.id
    const fileItem = this.mySharedFileList.value.find((file) => file.id === fileId)

    // 校验文件是否存在
    if (!fileItem || !fs.existsSync(fileItem.filePath) || fileItem.status.remaining < 1) {
      res.status(404).json({ error: 'File does not exist' })
      return
    }

    this.mySharedFileList.update(() => {
      fileItem.status.remaining -= 1
    })

    if (fileItem.status.remaining < 1) {
      this.mySharedFileList.value = this.mySharedFileList.value.filter((file) => file.id !== fileId)
    }

    const stat = fs.statSync(fileItem.filePath)
    const total = stat.size

    res.writeHead(200, {
      'Content-Length': total,
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${path.basename(fileItem.filePath)}"`,
    })
    fs.createReadStream(fileItem.filePath).pipe(res)
    console.log(`⬇️ Download: ${fileItem.filePath}`)
  }

  /** 获取文件列表 */
  private async handleQuery(_: Request<void>, res: Response) {
    this.mySharedFileList.value = this.mySharedFileList.value.filter(
      (file) => file.status.expiresAt! > Date.now(),
    )
    res.json(this.mySharedFileList.value)
  }
}
