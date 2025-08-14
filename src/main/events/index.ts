import { BrowserWindow, dialog, ipcMain, Tray } from 'electron'

export function createEventHandler({ mainWindow }: { mainWindow: BrowserWindow; tray: Tray }) {
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

  // 监听渲染进程的请求并返回多路径
  ipcMain.handle('select-paths', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'openDirectory', 'multiSelections'],
    })
    if (canceled) return []
    return filePaths
  })
}
