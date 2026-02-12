import { app, IpcMainInvokeEvent } from 'electron'
import { checkUpdate, downloadUpdate } from '../../utils/update'
import { getWindow } from '../../utils/window'

export function getCurrentVersion(_: IpcMainInvokeEvent) {
  return app.getVersion()
}

export function check() {
  return checkUpdate()
}

export function download() {
  const mainWindow = getWindow('main')
  return downloadUpdate(mainWindow!)
}
