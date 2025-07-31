import { app } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createCustomWindow } from './utils/window'
import { createEventHandler } from './events/index'
import { createTray } from './utils/tray'
import { stopAllTasks } from './utils/plugin'
import { installExtension, VUEJS_DEVTOOLS } from 'electron-devtools-installer'

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

  const mainWindow = createCustomWindow({
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

  mainWindow.show()

  const tray = createTray(mainWindow)
  createEventHandler({ mainWindow, tray })

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
      await stopAllTasks() // 等待所有任务清理完成
      console.log('before-quit: all stoped')
      global.flagQuit = true
      tray.destroy()
      app.quit() // 继续退出流程
    }
  })
})
