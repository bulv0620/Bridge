import { clipboard } from 'electron'
import { getWindow } from '../../../utils/window'

/**
 * 监听系统剪贴板中的磁力链接（magnet:?xt=urn:btih:...）
 */
export class MagnetWatcher {
  private timer: NodeJS.Timeout | null = null

  /**
   * 启动监听，每秒读取剪贴板内容
   */
  start(intervalMs?: number): void {
    clipboard.clear()
    if (this.timer) return
    this.timer = setInterval(this.checkClipboard, intervalMs || 1000)
  }

  /**
   * 停止监听
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  /**
   * 监听状态
   */
  getStatus(): boolean {
    return !!this.timer
  }

  private checkClipboard = (): void => {
    try {
      const txt = clipboard.readText().trim()
      if (txt) {
        const pattern =
          /(^magnet:\?xt=urn:btih:[a-fA-F0-9]{32,40})|(^https?:\/\/\S+\.torrent)(?:[?#].*)?$/i

        if (pattern.test(txt)) {
          const mainWindow = getWindow('main')
          mainWindow.show()
          mainWindow.setAlwaysOnTop(true)
          mainWindow.setAlwaysOnTop(false)
          mainWindow.focus()

          // console.log('检测到下载链接: ' + txt)
          mainWindow.webContents.send('href-to-page', {
            to: 'Downloader',
            query: {
              url: txt,
            },
          })

          clipboard.clear()
        }
      }
    } catch (e) {
      console.error('[ClipboardWatcher] 无法读取剪贴板内容', e)
    }
  }
}
