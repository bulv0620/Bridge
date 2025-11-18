import express, { Express, Request, Response } from 'express'
import { Server } from 'http'
import fs from 'fs'
import path from 'path'
import { remoteRef, RemoteRefMain } from '../../../utils/remoteRef'

export interface FileServerOptions {
  /** 监听端口号，默认 9525 */
  port?: number
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

  constructor(options: FileServerOptions = {}) {
    this.mySharedFileList = remoteRef('shared-file-list', [])

    this.port = options.port ?? 9520
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
    const range = req.headers.range

    if (!range) {
      // 没有 Range，返回整个文件
      res.writeHead(200, {
        'Content-Length': total,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${path.basename(fileItem.filePath)}"`,
      })
      fs.createReadStream(fileItem.filePath).pipe(res)
      console.log(`⬇️ Download: ${fileItem.filePath}`)
      return
    }

    // Range 模式
    const match = range.match(/bytes=(\d*)-(\d*)/)
    if (!match) {
      res.status(400).json({ error: 'Invalid range' })
      return
    }

    const start = parseInt(match[1], 10)
    const end = match[2] ? parseInt(match[2], 10) : total - 1

    if (Number.isNaN(start) || start >= total || end >= total) {
      res.status(416).set('Content-Range', `bytes */${total}`).end()
      return
    }

    const chunkSize = end - start + 1
    console.log(`📦 Chunk Request: File ID=${fileId} (${start}-${end}) ${chunkSize} bytes`)

    const fileStream = fs.createReadStream(fileItem.filePath, { start, end })
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${path.basename(fileItem.filePath)}"`,
    })
    fileStream.pipe(res)
  }

  /** 获取文件列表 */
  private async handleQuery(_: Request<void>, res: Response) {
    res.json(this.mySharedFileList.value)
  }
}
