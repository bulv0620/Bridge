import { app, clipboard, NativeImage, nativeImage } from 'electron'
import crypto from 'crypto'
import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import os from 'os'
import { pipeline } from 'stream/promises'
import { remoteRef, RemoteRefMain } from '../../../utils/remoteRef'
import { deviceId, deviceName } from '../../../config'
import { createLogger, shortId } from '../../../services/logging'

// 本地剪贴板缓存目录
const CLIPBOARD_DIR = path.join(app.getPath('userData'), 'clipboard')
const IMAGE_DIR = path.join(CLIPBOARD_DIR, 'images')
const FILE_DIR = path.join(CLIPBOARD_DIR, 'files')

// 最大历史记录数
const MAX_HISTORY = 25

async function ensureDir(dir: string) {
  await fsPromises.mkdir(dir, { recursive: true })
}

interface ClipboardSnapshot {
  v: string
  mime: ClipboardMime
  text?: string
  image?: NativeImage
}

export class ClipboardManager {
  public clipboardHistory: RemoteRefMain<ClipboardContent[]> = remoteRef('clipboard-history', [])

  // 最近一次剪贴板状态（用于去重 & 防回环）
  private lastState: ClipboardState | null = null
  private logger = createLogger('clipboard')

  private sha1() {
    return crypto.createHash('sha1')
  }

  private localDevice() {
    return {
      id: deviceId.value,
      name: deviceName.value,
      platform: os.platform(),
    }
  }

  private getMime(): ClipboardMime {
    const formats = clipboard.availableFormats()

    if (formats.includes('image/png')) return 'image/png'
    if (formats.includes('text/plain')) return 'text/plain'
    if (formats.includes('text/html')) return 'text/html'

    return 'unknown'
  }

  // 读取 & 计算剪贴板快照
  private readClipboardSnapshot(): ClipboardSnapshot | undefined {
    const mime = this.getMime()
    if (mime === 'unknown') return undefined

    const hash = this.sha1()
    hash.update(mime)

    if (mime === 'text/plain') {
      const text = clipboard.readText()
      hash.update(text)
      return {
        mime,
        text,
        v: hash.digest('hex'),
      }
    }

    if (mime === 'text/html') {
      const text = clipboard.readHTML()
      hash.update(text)
      return {
        mime,
        text,
        v: hash.digest('hex'),
      }
    }

    if (mime === 'image/png') {
      const image = clipboard.readImage()
      const buffer = image.toPNG()
      hash.update(buffer)
      return {
        mime,
        image,
        v: hash.digest('hex'),
      }
    }

    return undefined
  }

  // 计算本地剪贴板状态
  computeState(): ClipboardState | undefined {
    const snapshot = this.readClipboardSnapshot()
    if (!snapshot) return undefined

    // 状态未变化
    if (this.lastState?.v === snapshot.v) {
      return this.lastState
    }

    // 持久化并写入历史
    this.persistSnapshot(snapshot)
    this.logger.debug('clipboard.local.changed', {
      clipboardId: shortId(snapshot.v),
      mime: snapshot.mime,
      size:
        snapshot.text != null
          ? Buffer.byteLength(snapshot.text)
          : snapshot.image
            ? snapshot.image.toPNG().length
            : 0,
    })

    this.lastState = {
      v: snapshot.v,
      mime: snapshot.mime,
    }

    return this.lastState
  }

  // 快照持久化
  private persistSnapshot(snapshot: ClipboardSnapshot) {
    const now = Date.now()

    if (snapshot.mime.startsWith('text/')) {
      this.pushHistory({
        v: snapshot.v,
        mime: snapshot.mime,
        text: snapshot.text!,
        createdAt: now,
        device: this.localDevice(),
      })
      return
    }

    if (snapshot.mime === 'image/png') {
      const filePath = this.saveImage(snapshot.v, snapshot.image!)
      this.pushHistory({
        v: snapshot.v,
        mime: snapshot.mime,
        path: filePath,
        createdAt: now,
        device: this.localDevice(),
      })
    }
  }

  private saveImage(v: string, image: NativeImage): string {
    if (!fs.existsSync(IMAGE_DIR)) {
      fs.mkdirSync(IMAGE_DIR, { recursive: true })
    }

    const filePath = path.join(IMAGE_DIR, `${v}.png`)
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, image.toPNG())
    }

    return filePath
  }

  // 添加历史记录
  private pushHistory(item: ClipboardContent) {
    this.clipboardHistory.update((list) => {
      if (list[0]?.v === item.v) return

      list.unshift(item)

      if (list.length > MAX_HISTORY) {
        list.length = MAX_HISTORY
      }
    })
  }

  // 设置系统剪贴板
  setContent(content: ClipboardContent) {
    const { mime, text, path: filePath } = content

    switch (mime) {
      case 'text/plain':
        text != null && clipboard.writeText(text)
        break

      case 'text/html':
        text != null && clipboard.writeHTML(text)
        break

      case 'image/png':
        if (!filePath) return
        clipboard.writeImage(nativeImage.createFromBuffer(fs.readFileSync(filePath)))
        break

      default:
        break
    }

    this.logger.info('clipboard.content.applied', {
      clipboardId: shortId(content.v),
      mime,
      sourceDeviceId: shortId(content.device.id),
    })
  }

  // 从远端拉取剪贴板内容
  async fetchClipboard(url: string, msg: AnnounceMessage): Promise<void> {
    const state = msg.state?.clipboard
    if (!state || state.mime === 'unknown') return

    // 防止同步回环
    if (msg.device.id === deviceId.value) return
    if (this.lastState?.v === state.v) return

    const { v, mime } = state
    const startedAt = Date.now()
    this.logger.info('clipboard.fetch.started', {
      clipboardId: shortId(v),
      mime,
      sourceDeviceId: shortId(msg.device.id),
    })

    try {
      const res = await fetch(`${url}/api/clipboard/${v}`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const now = Date.now()

      if (mime.startsWith('text/')) {
        const text = await res.text()
        this.pushHistory({
          v,
          mime,
          text,
          createdAt: now,
          device: msg.device,
        })
      } else {
        const ext = this.getExtensionByMime(mime)
        await ensureDir(FILE_DIR)

        const filePath = path.join(FILE_DIR, `${v}.${ext}`)
        if (!fs.existsSync(filePath)) {
          if (!res.body) throw new Error('Response body is null')
          await pipeline(
            res.body as unknown as NodeJS.ReadableStream,
            fs.createWriteStream(filePath),
          )
        }

        this.pushHistory({
          v,
          mime,
          path: filePath,
          createdAt: now,
          device: msg.device,
        })
      }

      // 写入系统剪贴板并更新 lastState
      const latest = this.clipboardHistory.value[0]
      this.setContent(latest)

      this.lastState = { v, mime }
      this.logger.info('clipboard.fetch.completed', {
        clipboardId: shortId(v),
        mime,
        sourceDeviceId: shortId(msg.device.id),
        durationMs: Date.now() - startedAt,
      })
    } catch (error) {
      this.logger.error('clipboard.fetch.failed', error, {
        clipboardId: shortId(v),
        mime,
        sourceDeviceId: shortId(msg.device.id),
        durationMs: Date.now() - startedAt,
      })
      throw error
    }
  }

  private getExtensionByMime(mime: string): string {
    switch (mime) {
      case 'image/png':
        return 'png'
      case 'image/jpeg':
        return 'jpg'
      case 'text/html':
        return 'html'
      case 'text/plain':
        return 'txt'
      default:
        return 'bin'
    }
  }
}
