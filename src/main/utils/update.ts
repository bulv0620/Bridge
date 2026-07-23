import { BrowserWindow, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
import { messages } from '../locales'
import { destroyTray } from './tray'
import { createLogger } from '../services/logging'

const logger = createLogger('update')

export function checkUpdate() {
  return new Promise<string>((resolve, reject) => {
    const startedAt = Date.now()
    logger.info('update.check.started')
    // 开发模式跳过更新检测
    if (process.env.NODE_ENV === 'development') {
      logger.info('update.check.skipped', { reason: 'development' })
      resolve('')
      return
    }

    // 只检查，不下载
    autoUpdater.autoDownload = false
    autoUpdater.checkForUpdates()

    // 发现新版本
    autoUpdater.once('update-available', (info) => {
      logger.info('update.available', {
        version: info.version,
        durationMs: Date.now() - startedAt,
      })
      resolve(info.version)
    })

    // 没有新版本
    autoUpdater.once('update-not-available', () => {
      logger.info('update.not_available', { durationMs: Date.now() - startedAt })
      resolve('')
    })

    // 错误处理
    autoUpdater.once('error', (err) => {
      logger.error('update.check.failed', err, { durationMs: Date.now() - startedAt })
      reject(err)
    })
  })
}

let isDownloading = false
export function downloadUpdate(mainWindow: BrowserWindow) {
  return new Promise<void>((resolve, reject) => {
    if (isDownloading) {
      logger.debug('update.download.duplicate_ignored')
      resolve()
      return
    }

    isDownloading = true
    const startedAt = Date.now()
    logger.info('update.download.started')
    autoUpdater.downloadUpdate()

    autoUpdater.once('update-downloaded', async () => {
      mainWindow.webContents.send('new-version-ready')
      isDownloading = false
      logger.info('update.download.completed', { durationMs: Date.now() - startedAt })
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
        logger.info('update.install.confirmed')
        global.quitFlag = true
        destroyTray()
        autoUpdater.quitAndInstall()
      } else {
        logger.info('update.install.deferred')
      }
    })

    autoUpdater.once('error', (error) => {
      mainWindow.webContents.send('new-version-download-failed', error.message)
      isDownloading = false
      logger.error('update.download.failed', error, { durationMs: Date.now() - startedAt })
      reject(error)
    })
  })
}
