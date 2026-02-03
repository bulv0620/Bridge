import { ClipboardManager } from './service/ClipboardManager'
import { DeviceDiscovery } from './service/DeviceDiscovery'

let deviceDiscovery: DeviceDiscovery | null
const clipboardManager = new ClipboardManager()

export function startUdpService() {
  if (!deviceDiscovery) {
    deviceDiscovery = new DeviceDiscovery(clipboardManager)
  }
  deviceDiscovery.start()
}

export function stopUdpService() {
  if (!deviceDiscovery) return
  deviceDiscovery.stop()
}
