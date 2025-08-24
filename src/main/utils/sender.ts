import { BrowserWindow } from 'electron'

/**
 * 主线程推送消息
 * @param win
 * @param channel
 * @param args
 */
export function sendToRenderer(win: BrowserWindow, channel: string, ...args: any[]) {
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, ...args)
  }
}
