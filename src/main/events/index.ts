import { BrowserWindow, dialog, ipcMain, nativeTheme, shell, Tray } from 'electron'
import { updateTray } from '../utils/tray'
import { checkPluginStatus, getPluginInfo, PluginInfo, runTask, stopTask } from '../utils/plugin'
import { ClipboardWatcher } from '../utils/ClipboardWatcher'

export function createEventHandler({
  mainWindow,
  tray,
  clipboardWatcher,
}: {
  mainWindow: BrowserWindow
  tray: Tray
  clipboardWatcher: ClipboardWatcher
}) {
  // 设置APP主题模式
  ipcMain.handle('switch-theme', (_, type: 'light' | 'dark' | 'system') => {
    nativeTheme.themeSource = type
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

  // 监听渲染进程的请求并返回多路径
  ipcMain.handle('select-paths', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'openDirectory', 'multiSelections'],
    })
    if (canceled) return []
    return filePaths
  })

  // 获取所有插件列表
  ipcMain.handle('get-plugin-list', async () => {
    return getPluginInfo()
  })

  // 启动插件
  ipcMain.handle('start-plugin', async (_, pluginInfo: PluginInfo) => {
    return await runTask(pluginInfo)
  })

  // 关闭插件
  ipcMain.handle('stop-plugin', async (_, pluginInfo: PluginInfo) => {
    return stopTask(pluginInfo)
  })

  // 检测插件是否在运行
  ipcMain.handle('check-plugin-status', (_, pluginName: string) => {
    return checkPluginStatus(pluginName)
  })

  // 检测插件是否在运行
  ipcMain.handle('open-path', (_, path: string) => {
    return shell.openPath(path)
  })

  // 启动监听
  ipcMain.handle('open-clipboard-watcher', () => {
    clipboardWatcher.start(2000)
  })

  // 关闭监听
  ipcMain.handle('close-clipboard-watcher', () => {
    clipboardWatcher.stop()
  })

  // 获取监听状态
  ipcMain.handle('get-clipboard-watcher-status', () => {
    return clipboardWatcher.getStatus()
  })
}
