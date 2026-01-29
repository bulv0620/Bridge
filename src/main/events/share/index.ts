import { IpcMainInvokeEvent } from 'electron'
import { DeviceDiscovery } from './service/DeviceDiscovery'

const UDP_PORT = 9520

const deviceDiscovery = new DeviceDiscovery({
  udpPort: UDP_PORT,
})

export function start(_: IpcMainInvokeEvent) {
  deviceDiscovery.start()
}

export function stop(_: IpcMainInvokeEvent) {
  deviceDiscovery.stop()
}
