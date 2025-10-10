import { contextBridge } from 'electron'
import { on, off, once } from './listener'
import { generateApi } from './handler'

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
