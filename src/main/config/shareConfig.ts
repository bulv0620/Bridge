import { getStore } from '../store'
import { remoteRef } from '../utils/remoteRef'
import { startUdpService, stopUdpService } from '../modules/share'

const store = getStore()

const lanDiscoverable = remoteRef('lan-discoverable', store.get('lanDiscoverable'))
const capabilities = remoteRef('share-capabilities', store.get('capabilities'))

lanDiscoverable.onUpdate(
  (val) => {
    store.set('lanDiscoverable', val)
    if (val) {
      startUdpService()
    } else {
      stopUdpService()
    }
  },
  { immediate: true },
)

capabilities.onUpdate((val) => {
  store.set('capabilities', val)
})
