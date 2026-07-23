import { app } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createCustomWindow } from './utils/window'
import { createTray } from './utils/tray'
import { installExtension, VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import { initAppConfig } from './config/index'
import { registerAllEvents } from './modules/eventLoader'
import { registerClipboardProtocol } from './utils/clipboardProtocol'
import { createLogger, initializeLogging, registerGlobalErrorHandlers } from './services/logging'

initializeLogging()
registerGlobalErrorHandlers()
const logger = createLogger('app')
logger.info('app.starting', {
  version: app.getVersion(),
  platform: process.platform,
  arch: process.arch,
  packaged: app.isPackaged,
})

const gotTheLock = app.requestSingleInstanceLock({ myKey: 'bulv' })
if (!gotTheLock) {
  logger.info('app.single_instance.rejected')
  app.quit()
}

;(async () => {
  await app.whenReady()
  logger.info('app.ready')

  registerClipboardProtocol()

  installExtension(VUEJS_DEVTOOLS)
    .then(() => logger.debug('app.vue_devtools.installed'))
    .catch((error) => logger.warn('app.vue_devtools.install_failed', undefined, error))

  electronApp.setAppUserModelId('cc.bulv.bridge')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  initAppConfig()
  registerAllEvents()

  const mainWindow = createCustomWindow('main', {
    resizable: true,
    minWidth: 880,
    minHeight: 600,
    width: 1100,
  })

  createTray()

  app.on('activate', () => {
    logger.debug('app.activated')
    if (mainWindow) {
      mainWindow.show()
    }
  })

  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    logger.info('app.second_instance')
    // 如果用户再次打开应用，显示主窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  mainWindow.on('close', (event) => {
    if (!global.quitFlag) {
      // 在关闭窗口时取消默认行为，隐藏窗口到托盘
      event.preventDefault()
      mainWindow.hide()
      logger.debug('app.window.hidden_to_tray')
    }
  })
})().catch((error) => {
  logger.error('app.startup.failed', error)
  app.quit()
})

app.on('before-quit', () => {
  logger.info('app.before_quit')
})

app.on('will-quit', () => {
  logger.info('app.will_quit')
})
