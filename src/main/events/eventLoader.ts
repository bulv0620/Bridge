import { ipcMain } from 'electron'
import * as themeEvents from './theme'
import * as langEvents from './lang'
import * as fileEvents from './file'
import * as clipboardEvents from './clipboard'
import * as pluginEvents from './plugin'

// 事件映射
export const eventsMap = {
  theme: themeEvents,
  lang: langEvents,
  file: fileEvents,
  clipboard: clipboardEvents,
  plugin: pluginEvents,
}

export const handlerKeys: string[] = []

export function registerAllEvents() {
  Object.entries(eventsMap).forEach(([namespace, handlers]) => {
    Object.entries(handlers).forEach(([eventName, fn]) => {
      const key = `${namespace}:${eventName}`
      handlerKeys.push(key)

      ipcMain.handle(key, (_event, ...params) => (fn as Function)(_event, ...params))
    })
  })

  // 暴露一个 handler，让 preload 获取事件名
  ipcMain.handle('get-events-map', () => {
    const map: Record<string, string[]> = {}
    Object.entries(eventsMap).forEach(([namespace, handlers]) => {
      map[namespace] = Object.keys(handlers)
    })
    return map
  })
}

export type EventsMapType = typeof eventsMap
