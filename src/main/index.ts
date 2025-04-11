import { app, nativeTheme } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createCustomWindow } from './utils/window'
import { createEventHandler } from './events/index'
import { createTray } from './utils/tray'
import Store from 'electron-store'

const store = new Store()

// 主题
const theme = store.get('theme')
if (theme) {
  nativeTheme.themeSource = theme as 'system' | 'light' | 'dark'
}

const gotTheLock = app.requestSingleInstanceLock({ myKey: 'key' })
if (!gotTheLock) {
  app.quit()
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const mainWindow = createCustomWindow({
    resizable: true,
  })
  mainWindow.on('close', (event) => {
    // 在关闭窗口时取消默认行为，隐藏窗口到托盘
    if (!global.isQuiting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  const tray = createTray(mainWindow)
  createEventHandler({ mainWindow, store, tray })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
