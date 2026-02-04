import express from 'express'
import { AppStoreSchema } from '../../../store/types'
import ElectronStore from 'electron-store'
import { getStore } from '../../../store'
import http from 'http'
import { ClipboardManager } from './ClipboardManager'

export class ShareServer {
  private app = express()
  private server?: http.Server
  private readonly store: ElectronStore<AppStoreSchema>
  private port: number

  constructor(private clipboardManager: ClipboardManager) {
    this.store = getStore()
    this.port = this.store.get('ports').http

    this.setup()
  }

  private setup() {
    this.app.use(express.json())

    // 剪切板
    this.app.get('/api/clipboard', (_req, res) => {
      const content = this.clipboardManager.getContent()

      if (!content || !content.data) {
        res.status(204).end()
        return
      }

      const { mime, data } = content

      // 设置 MIME
      res.setHeader('Content-Type', mime)

      // Buffer（图片等）
      if (Buffer.isBuffer(data)) {
        res.send(data)
        return
      }

      // 字符串（文本 / HTML）
      res.send(data)
    })
  }

  start() {
    if (this.server) return

    this.server = this.app.listen(this.port, () => {
      console.log(`✅ ShareServer started on HTTP ${this.port}`)
    })
  }

  stop() {
    if (!this.server) return

    this.server.close(() => {
      console.log('🛑 ShareServer stopped')
    })
    this.server = undefined
  }
}
