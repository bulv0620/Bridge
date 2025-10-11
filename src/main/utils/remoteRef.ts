import { BrowserWindow, ipcMain } from 'electron'

export interface RemoteRefMain<T> {
  value: T
  destroy(): void
}

/**
 * 在主进程创建一个可同步的响应值
 */
export function remoteRef<T>(channel: string, initialValue: T): RemoteRefMain<T> {
  let value = structuredClone(initialValue)

  // 广播更新
  const broadcast = (payload: { value: T; txnId?: string }) => {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send('remote-ref:update', channel, payload)
      }
    }
  }

  // 接收渲染进程修改
  const changeListener = (_event: any, ch: string, payload: { value: T; txnId?: string }) => {
    if (ch === channel) {
      value = payload.value
      broadcast(payload)
    }
  }

  ipcMain.on('remote-ref:change', changeListener)

  ipcMain.on('remote-ref:request-init', (event, ch) => {
    if (ch === channel) {
      event.sender.send('remote-ref:update', ch, { value: value })
    }
  })

  return {
    get value() {
      return value
    },
    set value(v: T) {
      value = v
      broadcast({
        value,
      })
    },
    destroy() {
      ipcMain.removeListener('remote-ref:change', changeListener)
    },
  }
}
