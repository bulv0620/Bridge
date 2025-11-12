import { BrowserWindow, Tray, app, Menu, nativeImage } from 'electron'
import icon from '../../../resources/icon.png?asset'
import iconMac from '../../../resources/icon_plain.png?asset'
import { messages } from '../locales'
import { getWindow } from './window'

let tray: Tray | null = null

export function getTray() {
  return tray
}

export function createTray(): Tray {
  let trayIcon = nativeImage.createFromPath(icon)
  if (process.platform === 'darwin') {
    trayIcon = nativeImage.createFromPath(iconMac).resize({ width: 18, height: 18 })
    trayIcon.setTemplateImage(true)
  }
  tray = new Tray(trayIcon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: messages.en_US.tray.quit,
      click: () => {
        app.quit()
      },
    },
  ])

  tray.setToolTip('Bridge')
  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    const mainWindow = getWindow('main')
    mainWindow!.show()
  })

  return tray
}

export function updateTray(tray: Tray, lang: string, options: { mainWindow: BrowserWindow }) {
  const contextMenu = Menu.buildFromTemplate([
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
    {
      label: messages[lang].tray.downloader,
      click: () => {
        options.mainWindow.webContents.send('page:link', {
          to: 'Downloader',
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

  tray.setContextMenu(contextMenu)
}
