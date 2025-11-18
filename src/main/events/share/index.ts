import { IpcMainInvokeEvent } from 'electron'
import { DeviceDiscovery } from './service/DeviceDiscovery'
import { FileStore } from './store/FileStore'
import { FileServer } from './service/FileServer'

const UDP_PORT = 9520
const HTTP_PORT = 9520

const fileStore = new FileStore()
const deviceDiscovery = new DeviceDiscovery({
  udpPort: UDP_PORT,
  httpPort: HTTP_PORT,
})
const fileServer = new FileServer(fileStore, {
  port: HTTP_PORT,
})

export function start(_: IpcMainInvokeEvent) {
  deviceDiscovery.start()
  fileServer.start()
}

export function stop(_: IpcMainInvokeEvent) {
  deviceDiscovery.stop()
  fileServer.stop()
  fileStore.delAll()
}
