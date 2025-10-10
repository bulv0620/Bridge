import { BrowserWindow, ipcMain, WebContents } from 'electron'

export interface RemoteRefMain<T> {
  value: T
  destroy(): void
}

/**
 * 在主进程创建一个可同步的响应值
 */
export function remoteRef<T>(
  target: BrowserWindow | WebContents,
  channel: string,
  initialValue: T,
): RemoteRefMain<T> {
  let value = structuredClone(initialValue)
  const win = target instanceof BrowserWindow ? target.webContents : target

  // 广播更新
  const broadcast = () => {
    win.send('remote-ref:update', channel, structuredClone(value))
  }

  // 接收渲染进程修改
  const changeListener = (_event: any, ch: string, newVal: T) => {
    if (ch === channel) {
      value = structuredClone(newVal)
      broadcast()
    }
  }

  ipcMain.on('remote-ref:change', changeListener)

  return {
    get value() {
      return value
    },
    set value(v: T) {
      value = structuredClone(v)
      broadcast()
    },
    destroy() {
      ipcMain.removeListener('remote-ref:change', changeListener)
    },
  }
}
