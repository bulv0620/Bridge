import { IpcMainInvokeEvent } from 'electron'
import { DeviceDiscovery } from './core/DeviceDiscovery'
import { FileStore } from './store/FileStore'

const fileStore = new FileStore()
const deviceDiscovery = new DeviceDiscovery(fileStore)

export function start(_: IpcMainInvokeEvent) {
  deviceDiscovery.start()
}

export function stop(_: IpcMainInvokeEvent) {
  deviceDiscovery.stop()
  fileStore.delAll()
}

export function addFile(_: IpcMainInvokeEvent, file: SharedFileInfo) {
  fileStore.add(file)
  deviceDiscovery.getMyDevice().data.files.push(file)
}

export function removeFile(_: IpcMainInvokeEvent, file: SharedFileInfo) {
  fileStore.delById(file.id)
}
