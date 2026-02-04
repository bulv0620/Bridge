import { clipboard, nativeImage } from 'electron'
import crypto from 'crypto'
import { remoteRef, RemoteRefMain } from '../../../utils/remoteRef'

export class ClipboardManager {
  // 剪切板记录
  public clipboardHistory: RemoteRefMain<ClipboardContent[]>

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

  // 获取本地剪切板状态
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

  // 获取本地剪切板内容
  getContent(): { mime: ClipboardMime; data: string | Buffer | null } {
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

  // 设置本地剪切板内容
  setContent(mime: ClipboardMime, data: string | Buffer) {
    switch (mime) {
      case 'text/plain':
        clipboard.writeText(data as string)
        break

      case 'text/html':
        clipboard.writeHTML(data as string)
        break

      case 'image/png':
        clipboard.writeImage(nativeImage.createFromBuffer(data as Buffer))
        break
    }

    this.lastState = this.computeState()
  }

  // 获取远程剪切板内容
  async fetchClipboard(url: string, msg: AnnounceMessage): Promise<void> {
    if (msg.state?.clipboard?.mime === 'unknown') return
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

    // todo 需要正确处理返回：文本、buffer buffer需要缓存到本地，然后获得一个本地path
    const { content } = (await res.json()) as { content: string }

    // todo 加入之前需要判断是否已存在

    this.clipboardHistory.update((list) => {
      list.unshift({
        v: msg.state!.clipboard!.v,
        mime: msg.state!.clipboard!.mime,
        text: content,
        createdAt: new Date().getTime(),
        device: msg.device,
      })

      // todo 如果超过10个记录就pop一个，pop的是文件则根据文件path删除
    })

    // todo 完成后将内容写入到本地剪切板
  }
}
