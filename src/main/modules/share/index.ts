import { IpcMainInvokeEvent } from 'electron'
import { ClipboardManager } from './service/ClipboardManager'
import { DeviceDiscovery } from './service/DeviceDiscovery'
import { ShareServer } from './service/ShareServer'
import { deviceId, deviceName } from '../../config'
import os from 'os'
import { createLogger } from '../../services/logging'

let deviceDiscovery: DeviceDiscovery | null
let shareServer: ShareServer | null
const clipboardManager = new ClipboardManager()
const logger = createLogger('share')

export function startService() {
  if (!deviceDiscovery) {
    deviceDiscovery = new DeviceDiscovery(clipboardManager)
  }
  if (!shareServer) {
    shareServer = new ShareServer(clipboardManager)
  }
  void deviceDiscovery.start().catch((error) => {
    logger.error('discovery.start.failed', error)
  })
  shareServer.start()
}

export function stopService() {
  if (deviceDiscovery) {
    deviceDiscovery.stop()
  }
  if (shareServer) {
    shareServer.stop()
  }
  logger.info('share.services.stop_requested')
}

export function writeContent(_: IpcMainInvokeEvent, content: ClipboardContent) {
  clipboardManager.setContent(content)
}

export function getMyDeviceInfo(_: IpcMainInvokeEvent): DeviceInfo {
  return {
    id: deviceId.value,
    name: deviceName.value,
    platform: os.platform(),
  }
}
