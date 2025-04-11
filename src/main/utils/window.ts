import { BrowserWindow, nativeTheme, shell } from 'electron'
import { is } from '@electron-toolkit/utils'
import { join } from 'path'
import icon from '../../../resources/icon.png?asset'

export interface IWindowOptions {
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
  hideMenuBar?: boolean
  location?: string
  parent?: BrowserWindow
  modal?: boolean
  resizable?: boolean
}

export function createCustomWindow(windowOption?: IWindowOptions): BrowserWindow {
  const win = new BrowserWindow({
    width: windowOption?.width || 900,
    height: windowOption?.height || 600,
    minWidth: windowOption?.minWidth || 200,
    minHeight: windowOption?.minHeight || 50,
    resizable: windowOption?.resizable,
    show: false,
    autoHideMenuBar: windowOption?.hideMenuBar || true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
    parent: windowOption?.parent,
    modal: windowOption?.modal,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#ffffff00',
      symbolColor: nativeTheme.shouldUseDarkColors ? '#fff' : '#000',
      height: 32,
    },
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'] + getParsedLocation(windowOption?.location))
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), { hash: windowOption?.location })
  }

  const themeUpdateHandler = () => {
    win.setTitleBarOverlay({
      symbolColor: nativeTheme.shouldUseDarkColors ? '#fff' : '#000',
    })
    win.webContents.send('switch-theme', nativeTheme.themeSource)
  }
  nativeTheme.on('updated', themeUpdateHandler)
  win.on('close', () => {
    nativeTheme.removeListener('updated', themeUpdateHandler)
  })

  return win
}

function getParsedLocation(location?: string): string {
  if (!location) return '/#/'
  return location.startsWith('/') ? '/#' + location : '/#/' + location
}
