import { ipcRenderer } from 'electron'

export interface RemoteRefRenderer<T> {
  value: T
  onUpdate(fn: (v: T) => void): () => void
  destroy(): void
}

export const remoteRefBridge = {
  useRemoteRef<T>(channel: string, initialValue: T): RemoteRefRenderer<T> {
    let value = structuredClone(initialValue)
    const listeners = new Set<(v: T) => void>()

    const notify = (v: T) => {
      listeners.forEach((fn) => fn(v))
    }

    // 监听主进程广播
    const updateHandler = (_: any, ch: string, newVal: T) => {
      if (ch === channel) {
        value = structuredClone(newVal)
        notify(value)
      }
    }

    ipcRenderer.on('remote-ref:update', updateHandler)

    return {
      get value() {
        return value
      },
      onUpdate(fn) {
        listeners.add(fn)
        return () => listeners.delete(fn)
      },
      destroy() {
        ipcRenderer.removeListener('remote-ref:update', updateHandler)
        listeners.clear()
      },
    }
  },

  updateRemoteRef<T>(channel: string, value: T) {
    ipcRenderer.send('remote-ref:change', channel, structuredClone(value))
  },
}
