import { getStore } from '../store'
import { remoteRef } from '../utils/remoteRef'
import { startService, stopService } from '../modules/share'
import { app } from 'electron'

const store = getStore()

export const shareInterval = remoteRef('share-interval', store.get('shareInterval'))
export const httpPort = remoteRef('http-port', store.get('ports').http)
export const updPort = remoteRef('udp-port', store.get('ports').udp)

export const lanDiscovery = remoteRef('lan-discovery', store.get('lanDiscovery'))
export const capabilities = remoteRef('share-capabilities', store.get('capabilities'))

export const downloadPath = remoteRef('download-path', store.get('downloadPath'))

export function initShareConfig() {
  if (capabilities.value.includes('file-push')) {
    capabilities.value = Array.from(
      new Set(
        capabilities.value.map((capability) =>
          capability === 'file-push' ? 'file-push-v2' : capability,
        ),
      ),
    )
    store.set('capabilities', capabilities.value)
  }

  if (!downloadPath.value) {
    downloadPath.value = app.getPath('downloads')
    store.set('downloadPath', downloadPath.value)
  }

  lanDiscovery.onUpdate(
    (val) => {
      store.set('lanDiscovery', val)
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
