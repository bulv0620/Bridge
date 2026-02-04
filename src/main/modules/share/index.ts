import { ClipboardManager } from './service/ClipboardManager'
import { DeviceDiscovery } from './service/DeviceDiscovery'
import { ShareServer } from './service/ShareServer'

let deviceDiscovery: DeviceDiscovery | null
let shareServer: ShareServer | null
const clipboardManager = new ClipboardManager()

export function startService() {
  if (!deviceDiscovery) {
    deviceDiscovery = new DeviceDiscovery(clipboardManager)
  }
  if (!shareServer) {
    shareServer = new ShareServer(clipboardManager)
  }
  deviceDiscovery.start()
  shareServer.start()
}

export function stopService() {
  if (deviceDiscovery) {
    deviceDiscovery.stop()
  }
  if (shareServer) {
    shareServer.stop()
  }
}
