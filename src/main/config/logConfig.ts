import { getStore } from '../store'
import { setLogLevel } from '../services/logging'
import { remoteRef } from '../utils/remoteRef'

const store = getStore()

export const logLevel = remoteRef<LogLevel>('log-level', store.get('logLevel'))

export function initLogConfig() {
  logLevel.onUpdate(
    (level) => {
      setLogLevel(level)
      store.set('logLevel', level)
    },
    { immediate: true },
  )
}
