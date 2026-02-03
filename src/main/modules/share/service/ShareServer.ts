import express from 'express'
import { clipboard } from 'electron'
import { AppStoreSchema } from '../../../store/types'
import ElectronStore from 'electron-store'
import { getStore } from '../../../store'
import http from 'http'

export class ShareServer {
  private app = express()
  private server?: http.Server
  private readonly store: ElectronStore<AppStoreSchema>
  private port: number

  constructor() {
    this.store = getStore()
    this.port = this.store.get('ports').http

    this.setup()
  }

  private setup() {
    this.app.use(express.json())

    // 剪切板（当前只支持文本）
    this.app.get('/api/clipboard', (_req, res) => {
      const text = clipboard.readText()
      res.json({ content: text })
    })

    // this.app.post('/api/file', ...)
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
