import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { on, off, once } from './listener'
import { generateApi } from './handler'
import { remoteRefBridge } from './remoteRefBridge'

const shareFilesBridge: ShareFilesApi = {
  register(files) {
    const input = files.map((file) => ({
      path: webUtils.getPathForFile(file),
      mime: file.type || undefined,
    }))
    return ipcRenderer.invoke('share-files:register', input)
  },
  release(selectionId) {
    return ipcRenderer.invoke('share-files:release', selectionId)
  },
}

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
        contextBridge.exposeInMainWorld('shareFiles', shareFilesBridge)
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
      window.shareFiles = shareFilesBridge
    }
  })
  .catch((error) => reportPreloadError('bridge.initialize_failed', error))
