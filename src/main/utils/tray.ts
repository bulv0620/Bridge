import { BrowserWindow, Tray, app, Menu, nativeImage } from 'electron'
import icon from '../../../resources/icon.png?asset'
import iconMac from '../../../resources/icon_plain.png?asset'
import { messages } from '../locales'

export function createTray(mainWindow: BrowserWindow): Tray {
  let trayIcon = nativeImage.createFromPath(icon)
  if (process.platform === 'darwin') {
    trayIcon = nativeImage.createFromPath(iconMac).resize({ width: 18, height: 18 })
    trayIcon.setTemplateImage(true)
  }
  const tray = new Tray(trayIcon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: messages.en_US.tray.quit,
      click: () => {
        global.isQuiting = true
        app.quit()
      },
    },
  ])

  tray.setToolTip('My Electron App')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    showMainWindow()
  })

  const showMainWindow = () => {
    mainWindow.show()
  }

  return tray
}

export function updateTray(tray: Tray, lang: string, options: { mainWindow: BrowserWindow }) {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: messages[lang].tray.show,
      click: () => {
        options.mainWindow.show()
      },
    },
    // { type: 'separator' },
    {
      label: messages[lang].tray.quit,
      click: () => {
        global.isQuiting = true
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)
}
