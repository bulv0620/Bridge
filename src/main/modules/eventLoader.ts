import { ipcMain } from 'electron'
import * as fileEvents from './file'
import * as syncEvents from './sync'
import * as shareEvents from './share'
import * as updateEvents from './update'
import * as logEvents from './log'
import { createLogger } from '../services/logging'
import { registerShareFileSelectionBridge } from './share/service/ShareFileSelectionRegistry'

const logger = createLogger('ipc')
const SLOW_IPC_THRESHOLD_MS = 1000

// 事件映射
export const eventsMap = {
  file: fileEvents,
  sync: syncEvents,
  share: shareEvents,
  update: updateEvents,
  log: logEvents,
}

export const handlerKeys: string[] = []

export function registerAllEvents() {
  registerShareFileSelectionBridge()

  Object.entries(eventsMap).forEach(([namespace, handlers]) => {
    Object.entries(handlers).forEach(([eventName, fn]) => {
      const key = `${namespace}:${eventName}`
      handlerKeys.push(key)

      ipcMain.handle(key, async (_event, ...params) => {
        if (namespace === 'log') {
          return (fn as Function)(_event, ...params)
        }

        const startedAt = Date.now()
        try {
          const result = await (fn as Function)(_event, ...params)
          const durationMs = Date.now() - startedAt
          if (durationMs >= SLOW_IPC_THRESHOLD_MS) {
            logger.warn('ipc.slow', { namespace, eventName, durationMs })
          }
          return result
        } catch (error) {
          logger.error('ipc.failed', error, {
            namespace,
            eventName,
            durationMs: Date.now() - startedAt,
          })
          throw error
        }
      })
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
