import { app } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createCustomWindow } from './utils/window'
import { createTray } from './utils/tray'
import { installExtension, VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import { initAppConfig } from './config/index'
import { registerAllEvents } from './modules/eventLoader'
import { registerClipboardProtocol } from './utils/clipboardProtocol'

const gotTheLock = app.requestSingleInstanceLock({ myKey: 'bulv' })
if (!gotTheLock) {
  app.quit()
}

;(async () => {
  await app.whenReady()

  registerClipboardProtocol()

  installExtension(VUEJS_DEVTOOLS)
    .then(() => console.log(`vue_devtools installed`))
    .catch(() => console.error('vue_devtolls install failed'))

  electronApp.setAppUserModelId('cc.bulv.bridge')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const mainWindow = createCustomWindow('main', {
    resizable: true,
    minWidth: 880,
    minHeight: 600,
    width: 1100,
  })

  createTray()
  initAppConfig()
  registerAllEvents()

  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show()
    }
  })

  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
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
    }
  })
})()
