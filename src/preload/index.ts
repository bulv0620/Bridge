import { contextBridge, ipcRenderer } from 'electron'
import { on, off, once } from './listener'
import { generateApi } from './handler'
import { remoteRefBridge } from './remoteRefBridge'

function reportPreloadError(event: string, error: unknown) {
  const caughtError = error instanceof Error ? error : new Error(String(error))
  void ipcRenderer
    .invoke('log:write', {
      level: 'error',
      scope: 'preload',
      event,
      error: {
        name: caughtError.name,
        message: caughtError.message,
        stack: caughtError.stack,
      },
    } satisfies RendererLogInput)
    .catch(() => undefined)
}

generateApi()
  .then((ipc) => {
    if (process.contextIsolated) {
      try {
        contextBridge.exposeInMainWorld('ipc', ipc)
        contextBridge.exposeInMainWorld('events', {
          on,
          off,
          once,
        })
        contextBridge.exposeInMainWorld('remoteRef', remoteRefBridge)
      } catch (error) {
        reportPreloadError('bridge.expose_failed', error)
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
      // @ts-ignore (define in dts)
      window.remoteRef = remoteRefBridge
    }
  })
  .catch((error) => reportPreloadError('bridge.initialize_failed', error))
