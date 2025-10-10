import { ipcRenderer } from 'electron'

const listeners = new Map<string, Set<(...args: any[]) => void>>()

export function on(channel: string, callback: (...args: any[]) => void) {
  if (!listeners.has(channel)) {
    listeners.set(channel, new Set())
    ipcRenderer.on(channel, (_event, ...args) => {
      listeners.get(channel)?.forEach((cb) => cb(...args))
    })
  }
  listeners.get(channel)!.add(callback)
}

export function off(channel: string, callback: (...args: any[]) => void) {
  listeners.get(channel)?.delete(callback)
}

export function once(channel: string, callback: (...args: any[]) => void) {
  const wrapper = (...args: any[]) => {
    callback(...args)
    off(channel, wrapper)
  }
  on(channel, wrapper)
}
