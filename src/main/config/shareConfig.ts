import { getStore } from '../store'
import { remoteRef } from '../utils/remoteRef'
import { startService, stopService } from '../modules/share'
import { app } from 'electron'

const store = getStore()

export const shareInterval = remoteRef('share-interval', store.get('shareInterval'))
export const httpPort = remoteRef('http-port', store.get('ports').http)
export const updPort = remoteRef('udp-port', store.get('ports').udp)

export const lanDiscoverable = remoteRef('lan-discoverable', store.get('lanDiscoverable'))
export const capabilities = remoteRef('share-capabilities', store.get('capabilities'))

export const downloadPath = remoteRef('download-path', store.get('downloadPath'))

export function initShareConfig() {
  if (!downloadPath.value) {
    downloadPath.value = app.getPath('downloads')
    store.set('downloadPath', downloadPath.value)
  }

  lanDiscoverable.onUpdate(
    (val) => {
      store.set('lanDiscoverable', val)
      if (val) {
        startService()
      } else {
        stopService()
      }
    },
    { immediate: true },
  )

  capabilities.onUpdate((val) => {
    store.set('capabilities', val)
  })
}
