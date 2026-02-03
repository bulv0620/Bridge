import { clipboard, nativeImage } from 'electron'
import crypto from 'crypto'
import { remoteRef, RemoteRefMain } from '../../../utils/remoteRef'

export class ClipboardManager {
  // 剪切板记录
  private clipboardHistory: RemoteRefMain<ClipboardContent[]>

  //上一次状态
  private lastState: ClipboardState | null = null

  // 图片快速特征（避免重复 hash 大图）
  private lastImageMeta: { width: number; height: number } | null = null

  constructor() {
    this.clipboardHistory = remoteRef('clipboard-history', [])
  }

  private sha1(): crypto.Hash {
    return crypto.createHash('sha1')
  }

  private getMime(): ClipboardMime {
    const formats = clipboard.availableFormats()

    if (formats.includes('image/png')) return 'image/png'
    if (formats.includes('text/plain')) return 'text/plain'

    return 'unknown'
  }

  computeState(): ClipboardState {
    const mime = this.getMime()
    const hash = this.sha1()

    hash.update(mime)

    if (mime === 'text/plain') {
      hash.update(clipboard.readText())
    } else if (mime === 'text/html') {
      hash.update(clipboard.readHTML())
    } else if (mime === 'image/png') {
      const img = clipboard.readImage()
      const size = img.getSize()

      // 如果图片尺寸完全一致，极大概率没变
      if (
        this.lastImageMeta &&
        size.width === this.lastImageMeta.width &&
        size.height === this.lastImageMeta.height &&
        this.lastState?.mime === 'image/png'
      ) {
        return this.lastState
      }

      this.lastImageMeta = size
      hash.update(img.toPNG())
    }

    this.lastState = {
      mime,
      v: hash.digest('hex'),
    }

    return this.lastState
  }

  getContent(): { mime: ClipboardMime; data: any } {
    const mime = this.getMime()

    switch (mime) {
      case 'text/plain':
        return { mime, data: clipboard.readText() }

      case 'text/html':
        return { mime, data: clipboard.readHTML() }

      case 'image/png':
        return { mime, data: clipboard.readImage().toPNG() }

      default:
        return { mime: 'unknown', data: null }
    }
  }

  setContent(mime: ClipboardMime, data: any) {
    switch (mime) {
      case 'text/plain':
        clipboard.writeText(data)
        break

      case 'text/html':
        clipboard.writeHTML(data)
        break

      case 'image/png':
        clipboard.writeImage(nativeImage.createFromBuffer(data))
        break
    }

    this.lastState = this.computeState()
  }

  async fetchClipboard(url: string, msg: AnnounceMessage): Promise<void> {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      // 可选：超时
      signal: AbortSignal.timeout(3000),
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const { content } = (await res.json()) as { content: string }

    this.clipboardHistory.update((list) => {
      list.unshift({
        v: msg.state!.clipboard!.v,
        mime: msg.state!.clipboard!.mime,
        text: content,
        createdAt: new Date().getTime(),
        device: msg.device,
      })
    })
  }
}
