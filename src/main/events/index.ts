import { BrowserWindow, dialog, ipcMain, nativeTheme, Tray } from 'electron'
import ElectronStore from 'electron-store'
import { updateTray } from '../utils/tray'

export function createEventHandler({
  mainWindow,
  store,
  tray,
}: {
  mainWindow: BrowserWindow
  store: ElectronStore
  tray: Tray
}) {
  // 获取APP当前主题模式
  ipcMain.handle('current-theme', () => {
    return nativeTheme.themeSource
  })

  // 设置APP主题模式
  ipcMain.handle('switch-theme', (_, type: 'light' | 'dark' | 'system') => {
    nativeTheme.themeSource = type
    store.set('theme', type)
  })

  // 设置APP语言更新tray
  ipcMain.handle('switch-lang', (_, lang: string) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('switch-lang', lang)
    })
    updateTray(tray, lang, { mainWindow })
  })

  // 监听渲染进程的请求并返回文件夹路径
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    })

    if (result.canceled) {
      return null
    } else {
      return result.filePaths[0] // 返回所选文件夹路径
    }
  })
}
