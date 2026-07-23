import { BrowserWindow, nativeTheme, shell } from 'electron'
import { is } from '@electron-toolkit/utils'
import { join } from 'path'
import { icon } from './iconPath'
import os from 'os'
import { createLogger } from '../services/logging'

const windowInstances = new Map<string, BrowserWindow>()
export const WINDOW_TITLE_BAR_HEIGHT = 42
const logger = createLogger('window')

function getWindowControlSymbolColor() {
  return nativeTheme.shouldUseDarkColors ? '#F3F4F6' : '#20242D'
}

export function updateWindowTitleBarTheme(win: BrowserWindow) {
  if (os.platform() === 'darwin' || win.isDestroyed()) return

  win.setTitleBarOverlay({
    color: '#00000000',
    symbolColor: getWindowControlSymbolColor(),
    height: WINDOW_TITLE_BAR_HEIGHT,
  })
}

export function getWindow(name: string) {
  return windowInstances.get(name)
}

export function createCustomWindow(
  name: string,
  windowOption?: CreateWindowOptions,
): BrowserWindow {
  logger.info('window.create.started', { name })
  const win = new BrowserWindow({
    width: windowOption?.width || 990,
    height: windowOption?.height || 660,
    minWidth: windowOption?.minWidth || 200,
    minHeight: windowOption?.minHeight || 50,
    resizable: windowOption?.resizable,
    show: false,
    autoHideMenuBar: windowOption?.hideMenuBar || true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#15171c' : '#eef1f6',
    titleBarStyle: os.platform() === 'darwin' ? 'hiddenInset' : 'hidden',
    roundedCorners: true,
    ...(os.platform() === 'darwin'
      ? {
          trafficLightPosition: { x: 16, y: 13 },
        }
      : {
          titleBarOverlay: {
            color: '#00000000',
            symbolColor: getWindowControlSymbolColor(),
            height: WINDOW_TITLE_BAR_HEIGHT,
          },
        }),
    ...(os.platform() === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
    },
    parent: windowOption?.parent,
    modal: windowOption?.modal,
    icon: join(__dirname, '../../build/icon.ico'),
  })

  // 缓存win实例
  windowInstances.set(name, win)

  win.on('ready-to-show', () => {
    logger.info('window.ready', { name, webContentsId: win.webContents.id })
    win.show()
  })

  win.on('unresponsive', () => {
    logger.warn('window.unresponsive', { name, webContentsId: win.webContents.id })
  })

  win.webContents.on('preload-error', (_event, preloadPath, error) => {
    logger.error('window.preload.failed', error, {
      name,
      preloadPath,
      webContentsId: win.webContents.id,
    })
  })

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    logger.error('window.load.failed', new Error(errorDescription), {
      name,
      errorCode,
      url: validatedURL,
      webContentsId: win.webContents.id,
    })
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

  return win
}

function getParsedLocation(location?: string): string {
  if (!location) return '/#/'
  return location.startsWith('/') ? '/#' + location : '/#/' + location
}
