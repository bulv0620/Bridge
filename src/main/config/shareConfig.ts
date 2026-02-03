import { getStore } from '../store'
import { remoteRef } from '../utils/remoteRef'
import { startService, stopService } from '../modules/share'

const store = getStore()

const lanDiscoverable = remoteRef('lan-discoverable', store.get('lanDiscoverable'))
const capabilities = remoteRef('share-capabilities', store.get('capabilities'))

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
