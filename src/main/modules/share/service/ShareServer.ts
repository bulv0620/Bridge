import express from 'express'
import http from 'http'
import { ClipboardManager } from './ClipboardManager'
import { downloadPath, httpPort } from '../../../config'
import fs from 'fs'
import { dialog } from 'electron'
import { getWindow } from '../../../utils/window'
import path from 'path'
import { formatBytes } from '../../../utils/format'
import { remoteRef, RemoteRefMain } from '../../../utils/remoteRef'

export class ShareServer {
  private app = express()
  private server?: http.Server
  private receivingMap: Map<string, ReceivingItem> = new Map()
  private receivingList: RemoteRefMain<ReceivingItem[]> = remoteRef('receiving-list', [])
  private receivedList: RemoteRefMain<ReceivedItem[]> = remoteRef('received-list', [])

  constructor(private clipboardManager: ClipboardManager) {
    this.app.use(express.json())

    // 剪切板
    this.app.get('/api/clipboard/:v', this.clipboardHandler.bind(this))
    // 请求上传
    this.app.post('/api/upload/request', this.requestUploadHandler.bind(this))
    // 上传文件
    this.app.post('/api/upload/:uploadId', this.uploadHandler.bind(this))
  }

  // 剪切板接口处理
  private clipboardHandler(req: express.Request, res: express.Response) {
    const { v } = req.params

    const clipboardHistory = this.clipboardManager.clipboardHistory
    const clipboardItem = clipboardHistory.value.find((c) => c.v === v)

    if (!clipboardItem) {
      res.status(404).end()
      return
    }

    const { mime, text, path } = clipboardItem

    res.setHeader('Content-Type', mime)

    // 文本内容
    if (text != null) {
      res.send(text)
      return
    }

    // 文件内容（图片 / 大内容）
    if (path) {
      // 文件不存在
      if (!fs.existsSync(path)) {
        res.status(410).end()
        return
      }

      res.sendFile(path)
      return
    }

    res.status(500).end()
  }

  // 请求上传接口处理
  private async requestUploadHandler(req: express.Request, res: express.Response) {
    const fileMeta = req.body as FileMeta

    if (!fileMeta.filename || !fileMeta.size || !fileMeta.device) {
      res.status(400).end()
      return
    }

    const allowed = await this.confirmReceiveFile(fileMeta)

    if (!allowed) {
      res.status(403).json({ allowed: false })
      return
    }

    const uploadId = crypto.randomUUID()

    const rawPath = path.join(downloadPath.value, fileMeta.filename)
    const savePath = this.resolveSavePath(rawPath)

    this.receivingMap.set(uploadId, {
      id: uploadId,
      meta: fileMeta,
      status: 'pending',
      progress: {
        transferred: 0,
        total: fileMeta.size,
        percentage: 0,
      },
      savePath,
      createdAt: Date.now(),
    })
    this.syncReceivingList()

    res.json({ allowed: true, uploadId })
  }

  // 上传文件接口处理
  private async uploadHandler(req: express.Request, res: express.Response) {
    const { uploadId } = req.params
    const receivingItem = this.receivingMap.get(uploadId)

    if (!receivingItem) {
      res.status(404).end()
      return
    }
    // 更新状态
    receivingItem.status = 'receiving'

    const writeStream = fs.createWriteStream(receivingItem.savePath)
    req.pipe(writeStream)

    // 实时监听并更新进度
    const total = receivingItem.meta.size
    let transferred = 0
    const startTime = Date.now()
    receivingItem.progress = {
      transferred: 0,
      total,
      percentage: 0,
    }

    // 监听上传流
    req.on('data', (chunk: Buffer) => {
      transferred += chunk.length

      const now = Date.now()
      const elapsed = (now - startTime) / 1000 || 1
      const speed = transferred / elapsed
      const remaining = total - transferred

      receivingItem.progress.transferred = transferred
      receivingItem.progress.percentage = Math.min(transferred / total, 1)
      receivingItem.progress.speed = speed
      receivingItem.progress.eta = remaining / speed

      // 100ms 合并一次更新
      this.scheduleSyncReceiving()
    })

    req.on('aborted', () => {
      writeStream.destroy(new Error('aborted'))
    })

    req.on('error', () => {
      writeStream.destroy(new Error('error'))
    })

    req.pipe(writeStream)

    writeStream.on('finish', () => {
      receivingItem.status = 'received'
      receivingItem.progress.percentage = 1

      this.receivingMap.delete(uploadId)
      this.syncReceivingList()

      // 加入到receivedList（成功项）
      this.receivedList.update((list) => {
        list.unshift({
          id: uploadId,
          meta: receivingItem.meta,
          result: 'success',
          save: {
            path: receivingItem.savePath,
            filename: receivingItem.meta.filename,
            size: receivingItem.meta.size,
          },
          createdAt: receivingItem.createdAt,
          finishedAt: Date.now(),
        })
      })

      res.json({ success: true })
    })

    writeStream.on('error', (err) => {
      console.error(err)
      this.receivingMap.delete(uploadId)
      this.syncReceivingList()

      // 加入到receivedList（失败项）
      this.receivedList.update((list) => {
        list.unshift({
          id: uploadId,
          meta: receivingItem.meta,
          result: 'failed',
          error: {
            message: err && err.message ? String(err.message) : String(err),
          },
          createdAt: receivingItem.createdAt,
          finishedAt: Date.now(),
        })
      })

      res.status(500).end()
    })
  }

  start() {
    if (this.server) return

    this.server = this.app.listen(httpPort.value, () => {
      console.log(`✅ ShareServer started on HTTP ${httpPort.value}`)
    })
  }

  stop() {
    if (!this.server) return

    this.server.close(() => {
      console.log('🛑 ShareServer stopped')
    })
    this.server = undefined
  }

  private scheduleSyncReceiving = (() => {
    let timer: NodeJS.Timeout | null = null

    return () => {
      if (timer) return

      timer = setTimeout(() => {
        timer = null
        this.syncReceivingList()
      }, 100)
    }
  })()

  syncReceivingList() {
    this.receivingList.value = Array.from(this.receivingMap.values())
  }

  resolveSavePath(basePath: string): string {
    if (!fs.existsSync(basePath)) return basePath

    const dir = path.dirname(basePath)
    const ext = path.extname(basePath)
    const name = path.basename(basePath, ext)

    let i = 1
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const p = path.join(dir, `${name} (${i})${ext}`)
      if (!fs.existsSync(p)) return p
      i++
    }
  }

  async confirmReceiveFile(fileMeta: FileMeta): Promise<boolean> {
    const win = getWindow('main')
    win?.show()
    win?.focus()

    const { response } = await dialog.showMessageBox(win!, {
      type: 'question',
      buttons: ['接收', '拒绝'],
      defaultId: 0,
      cancelId: 1,
      title: '接收文件',
      message: '是否接收文件？',
      detail: `文件名: ${fileMeta.filename}\n大小: ${formatBytes(fileMeta.size)}\n来自: ${fileMeta.device.name}`,
    })

    return response === 0
  }
}
