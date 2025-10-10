import { ipcRenderer } from 'electron'

export async function generateApi() {
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
