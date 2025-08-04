import { clipboard } from 'electron'

/**
 * 监听系统剪贴板中的磁力链接（magnet:?xt=urn:btih:...）
 * 用于快速捕获用户复制的 BT 链接，便于调试或自动添加任务
 *
 * 使用示例：
 * const watcher = new ClipboardWatcher()
 * watcher.start()
 * // ...
 * watcher.stop()
 */
export class ClipboardWatcher {
  private timer: NodeJS.Timeout | null = null
  private lastText: string = ''

  /**
   * 启动监听，每秒读取剪贴板内容
   */
  start(intervalMs = 1000): void {
    if (this.timer) return
    this.timer = setInterval(this.checkClipboard, intervalMs)
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

  private checkClipboard = (): void => {
    try {
      const txt = clipboard.readText().trim()
      if (txt && txt !== this.lastText) {
        this.lastText = txt

        // 简单识别 BT 链接：magnet:?xt=urn:btih:
        if (/^magnet:\?xt=urn:btih:[a-fA-F0-9]{32,40}/.test(txt)) {
          console.log('[ClipboardWatcher] 检测到 Magnet 链接:', txt)
        }
      }
    } catch (e) {
      console.error('[ClipboardWatcher] 无法读取剪贴板内容', e)
    }
  }
}
