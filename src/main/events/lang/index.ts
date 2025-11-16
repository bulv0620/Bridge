import { BrowserWindow, IpcMainInvokeEvent } from 'electron'
import { updateTray } from '../../utils/tray'
import { getWindow } from '../../utils/window'

export function change(_: IpcMainInvokeEvent, lang: string) {
  const mainWindow = getWindow('main')
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('lang:switch', lang)
  })
  updateTray(lang, { mainWindow: mainWindow! })
}
