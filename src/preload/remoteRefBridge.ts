import { ipcRenderer } from 'electron'

interface UpdatePayload<T> {
  value: T
  txnId?: string
}

export interface RemoteRefRenderer<T> {
  value: T
  onUpdate(fn: (payload: UpdatePayload<T>) => void): () => void
  destroy(): void
}

export const remoteRefBridge = {
  useRemoteRef<T>(channel: string, initialValue: T): RemoteRefRenderer<T> {
    const value = structuredClone(initialValue)
    const listeners = new Set<(payload: UpdatePayload<T>) => void>()

    // 监听主进程广播
    const updateHandler = (_: any, payload: UpdatePayload<T>) => {
      listeners.forEach((fn) => fn(payload))
    }

    ipcRenderer.on('remote-ref:update:' + channel, updateHandler)
    ipcRenderer.send('remote-ref:request-init:' + channel)

    return {
      get value() {
        return value
      },
      onUpdate(fn) {
        listeners.add(fn)
        return () => listeners.delete(fn)
      },
      destroy() {
        ipcRenderer.removeListener('remote-ref:update:' + channel, updateHandler)
        listeners.clear()
      },
    }
  },

  updateRemoteRef<T>(channel: string, payload: UpdatePayload<T>) {
    ipcRenderer.send('remote-ref:change:' + channel, payload)
  },
}
