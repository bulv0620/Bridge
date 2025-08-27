import { BrowserWindow, IpcMainInvokeEvent } from 'electron'
import { getTray, updateTray } from '../../utils/tray'
import { getWindow } from '../../utils/window'

export function change(_: IpcMainInvokeEvent, lang: string) {
  const tray = getTray()
  const mainWindow = getWindow('main')
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('lang:switch', lang)
  })
  updateTray(tray!, lang, { mainWindow })
}
