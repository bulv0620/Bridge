import { BrowserWindow, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
import { messages } from '../locales'

export function checkUpdate() {
  return new Promise<string>((resolve) => {
    // 开发模式跳过更新检测
    if (process.env.NODE_ENV === 'development') {
      resolve('')
      return
    }

    // 只检查，不下载
    autoUpdater.autoDownload = false
    autoUpdater.checkForUpdates()

    // 发现新版本
    autoUpdater.once('update-available', (info) => {
      resolve(info.version)
    })

    // 没有新版本
    autoUpdater.once('update-not-available', () => {
      resolve('')
    })
  })
}

let isDownloading = false
export function downloadUpdate(mainWindow: BrowserWindow) {
  return new Promise<void>((resolve, reject) => {
    if (isDownloading) {
      resolve()
      return
    }

    isDownloading = true
    autoUpdater.downloadUpdate()

    autoUpdater.once('update-downloaded', async () => {
      mainWindow.webContents.send('new-version-ready')
      isDownloading = false
      resolve()

      const result = await dialog.showMessageBox({
        type: 'info',
        buttons: [
          messages[global.lang || 'en_US'].update.confirm,
          messages[global.lang || 'en_US'].update.later,
        ],
        title: messages[global.lang || 'en_US'].update.prompt,
        message: messages[global.lang || 'en_US'].update.confirmMessage,
      })

      if (result.response === 0) {
        autoUpdater.quitAndInstall()
      }
    })

    autoUpdater.once('error', (error) => {
      mainWindow.webContents.send('new-version-download-failed', error.message)
      isDownloading = false
      reject(error)
    })
  })
}
