import { BrowserWindow, nativeTheme, shell } from 'electron'
import { is } from '@electron-toolkit/utils'
import { join } from 'path'
import icon from '../../../resources/icon.png?asset'

const windowInstances = new Map()

export function getWindow(name: string) {
  return windowInstances.get(name)
}

export function createCustomWindow(
  name: string,
  windowOption?: CreateWindowOptions,
): BrowserWindow {
  const win = new BrowserWindow({
    width: windowOption?.width || 990,
    height: windowOption?.height || 660,
    minWidth: windowOption?.minWidth || 200,
    minHeight: windowOption?.minHeight || 50,
    fullscreenable: false,
    resizable: windowOption?.resizable,
    show: false,
    autoHideMenuBar: windowOption?.hideMenuBar || true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
    },
    parent: windowOption?.parent,
    modal: windowOption?.modal,
    ...(process.platform !== 'darwin'
      ? {
          titleBarOverlay: {
            color: '#ffffff00',
            symbolColor: nativeTheme.shouldUseDarkColors ? '#fff' : '#000',
            height: 32,
          },
        }
      : {}),
    icon: join(__dirname, '../../build/icon.ico'),
  })

  // 缓存win实例
  windowInstances.set(name, win)

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
    win.webContents.send('theme:switch', nativeTheme.themeSource)
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
