import { IpcMainInvokeEvent } from 'electron'
import { DeviceDiscovery } from './core/DeviceDiscovery'

const deviceDiscovery = new DeviceDiscovery()

export function start(_: IpcMainInvokeEvent) {
  deviceDiscovery.start()
}

export function stop(_: IpcMainInvokeEvent) {
  deviceDiscovery.stop()
}
