import { IpcMainInvokeEvent } from 'electron'
import { ClipboardManager } from './service/ClipboardManager'
import { DeviceDiscovery } from './service/DeviceDiscovery'
import { ShareServer } from './service/ShareServer'
import { FileSender } from './service/FileSender'
import { deviceId, deviceName } from '../../config'
import os from 'os'
import { createLogger } from '../../services/logging'
import { getWindow } from '../../utils/window'

let deviceDiscovery: DeviceDiscovery | null = null
let shareServer: ShareServer | null = null
const clipboardManager = new ClipboardManager()
const logger = createLogger('share')
const fileSender = new FileSender((targetDeviceId) =>
  deviceDiscovery?.getOnlineDevices().find((device) => device.id === targetDeviceId),
)

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
  fileSender.stop()
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

export function sendFileBatch(
  _: IpcMainInvokeEvent,
  selectionId: unknown,
  targetDeviceId: unknown,
) {
  return fileSender.sendSelection(selectionId, targetDeviceId)
}

export function cancelSendingFile(_: IpcMainInvokeEvent, taskId: unknown) {
  return fileSender.cancel(taskId)
}

export function deleteSentTask(event: IpcMainInvokeEvent, taskId: unknown) {
  assertMainWindowSender(event)
  return fileSender.deleteSentTask(taskId)
}

export function deleteReceivedTask(event: IpcMainInvokeEvent, taskId: unknown) {
  assertMainWindowSender(event)
  return shareServer?.deleteReceivedTask(taskId) ?? false
}

export function acknowledgeIncomingBatchNavigation(event: IpcMainInvokeEvent, requestId: unknown) {
  assertMainWindowSender(event)
  return shareServer?.acknowledgeIncomingBatchNavigation(requestId) ?? false
}

function assertMainWindowSender(event: IpcMainInvokeEvent) {
  const mainWindow = getWindow('main')
  if (!mainWindow || event.sender !== mainWindow.webContents) {
    throw new Error('INVALID_IPC_SENDER')
  }
}
