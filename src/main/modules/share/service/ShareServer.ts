import express from 'express'
import http from 'http'
import { ClipboardManager } from './ClipboardManager'
import { httpPort } from '../../../config'
import fs from 'fs'

export class ShareServer {
  private app = express()
  private server?: http.Server

  constructor(private clipboardManager: ClipboardManager) {
    this.setup()
  }

  private setup() {
    // this.app.use(express.json())

    // 剪切板
    this.app.get('/api/clipboard/:v', (req, res) => {
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
}
