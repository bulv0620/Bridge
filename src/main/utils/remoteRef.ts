import { BrowserWindow, ipcMain } from 'electron'

export interface RemoteRefMain<T> {
  value: T
  destroy(): void
  update(fn: (v: T) => void): void
  onUpdate(fn: (v: T) => void, options?: { immediate?: boolean }): void
}

/**
 * 在主进程创建一个可同步的响应值
 */
export function remoteRef<T>(
  channel: string,
  initialValue: T,
  options?: { readOnly?: boolean },
): RemoteRefMain<T> {
  let value = structuredClone(initialValue)

  const cb: ((v: T) => void)[] = []

  // 广播更新
  const broadcast = (payload: { value: T; txnId?: string }) => {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send('remote-ref:update:' + channel, payload)
      }
    }
  }

  // 接收渲染进程修改
  const changeListener = (_event: any, payload: { value: T; txnId?: string }) => {
    value = payload.value
    broadcast(payload)

    cb.forEach((fn) => fn(value))
  }

  if (!options?.readOnly) {
    ipcMain.on('remote-ref:change:' + channel, changeListener)
  }

  ipcMain.on('remote-ref:request-init:' + channel, (event) => {
    event.sender.send('remote-ref:update:' + channel, { value: value })
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
      cb.forEach((fn) => fn(value))
    },
    update(fn: (v: T) => void) {
      fn(value)
      broadcast({ value })
      cb.forEach((fn) => fn(value))
    },
    onUpdate(fn: (v: T) => void, options?: { immediate?: boolean }) {
      cb.push(fn)

      // 如果配置了 immediate，立即执行一次
      if (options?.immediate) {
        fn(value)
      }
    },
    destroy() {
      if (!options?.readOnly) {
        ipcMain.removeListener('remote-ref:change:' + channel, changeListener)
      }
      cb.length = 0
    },
  }
}
