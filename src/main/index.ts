import { app } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createCustomWindow } from './utils/window'
import { createTray } from './utils/tray'
import { installExtension, VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import { registerAllEvents } from './events/eventLoader'
import { stopAll } from './events/plugin'

const gotTheLock = app.requestSingleInstanceLock({ myKey: 'key' })
if (!gotTheLock) {
  app.quit()
}

app.whenReady().then(() => {
  installExtension(VUEJS_DEVTOOLS)
    .then(() => console.log(`vue_devtools installed`))
    .catch(() => console.error('vue_devtolls install failed'))

  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const mainWindow = createCustomWindow('main', {
    resizable: true,
    minWidth: 880,
    minHeight: 600,
  })
  mainWindow.on('close', (event) => {
    if (!global.flagQuit) {
      // 在关闭窗口时取消默认行为，隐藏窗口到托盘
      event.preventDefault()
      mainWindow.hide()
    }
  })

  const tray = createTray()
  registerAllEvents()

  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    // 如果用户再次打开应用，显示主窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.on('before-quit', async (event) => {
    if (!global.flagQuit) {
      event.preventDefault() // 阻止默认退出
      console.log('before-quit: stopping all plugin tasks...')
      await stopAll()
      console.log('before-quit: all stoped')
      global.flagQuit = true
      tray.destroy()
      app.quit() // 继续退出流程
    }
  })
})
