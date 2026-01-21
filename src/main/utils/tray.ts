import { BrowserWindow, Tray, app, Menu, nativeImage } from 'electron'
import { messages } from '../locales'
import { getWindow } from './window'
import { icon, iconMac } from './iconPath'
import os from 'os'

let tray: Tray
let contextMenu: Menu

export function createTray(): Tray {
  let trayIcon = nativeImage.createFromPath(icon)
  if (os.platform() === 'darwin') {
    trayIcon = nativeImage.createFromPath(iconMac).resize({ width: 18, height: 18 })
    trayIcon.setTemplateImage(true)
  }
  tray = new Tray(trayIcon)

  contextMenu = Menu.buildFromTemplate([
    {
      label: messages.en_US.tray.quit,
      click: () => {
        app.quit()
      },
    },
  ])

  tray.setToolTip('Bridge')
  if (os.platform() === 'linux') {
    tray.setContextMenu(contextMenu)
  }

  // 左键：打开窗口
  tray.on('click', () => {
    const mainWindow = getWindow('main')
    mainWindow!.show()
    mainWindow!.focus()
  })

  // 右键：弹出菜单
  tray.on('right-click', () => {
    tray.popUpContextMenu(contextMenu)
  })

  return tray
}

export function updateTray(lang: string, options: { mainWindow: BrowserWindow }) {
  contextMenu = Menu.buildFromTemplate([
    {
      label: messages[lang].tray.fileSync,
      click: () => {
        options.mainWindow.webContents.send('page:link', {
          to: 'FileSync',
        })
        options.mainWindow.show()
      },
    },
    {
      label: messages[lang].tray.shareHub,
      click: () => {
        options.mainWindow.webContents.send('page:link', {
          to: 'ShareHub',
        })
        options.mainWindow.show()
      },
    },
    { type: 'separator' },
    {
      label: messages[lang].tray.setting,
      click: () => {
        options.mainWindow.webContents.send('page:link', {
          to: 'Setting',
        })
        options.mainWindow.show()
      },
    },
    {
      label: messages[lang].tray.quit,
      click: () => {
        app.quit()
      },
    },
  ])
  if (os.platform() === 'linux') {
    tray.setContextMenu(contextMenu)
  }
}
