import { contextBridge, ipcRenderer } from 'electron'

async function generateApi() {
  const api: Record<string, Record<string, (...args: any[]) => Promise<any>>> = {}
  const eventsMap: Record<string, string[]> = await ipcRenderer.invoke('get-events-map')

  for (const [namespace, events] of Object.entries(eventsMap)) {
    api[namespace] = {}
    for (const eventName of events) {
      const key = `${namespace}:${eventName}`
      api[namespace][eventName] = (...args: any[]) => ipcRenderer.invoke(key, ...args)
    }
  }

  return api
}

const listeners = new Map<string, Set<(...args: any[]) => void>>()

function on(channel: string, callback: (...args: any[]) => void) {
  if (!listeners.has(channel)) {
    listeners.set(channel, new Set())
    ipcRenderer.on(channel, (_event, ...args) => {
      listeners.get(channel)?.forEach((cb) => cb(...args))
    })
  }
  listeners.get(channel)!.add(callback)
}

function off(channel: string, callback: (...args: any[]) => void) {
  listeners.get(channel)?.delete(callback)
}

function once(channel: string, callback: (...args: any[]) => void) {
  const wrapper = (...args: any[]) => {
    callback(...args)
    off(channel, wrapper)
  }
  on(channel, wrapper)
}

generateApi().then((ipc) => {
  if (process.contextIsolated) {
    try {
      contextBridge.exposeInMainWorld('ipc', ipc)
      contextBridge.exposeInMainWorld('events', {
        on,
        off,
        once,
      })
    } catch (error) {
      console.error(error)
    }
  } else {
    // @ts-ignore (define in dts)
    window.ipc = ipc
    // @ts-ignore (define in dts)
    window.events = {
      on,
      off,
      once,
    }
  }
})
