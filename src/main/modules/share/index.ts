import { DeviceDiscovery } from './service/DeviceDiscovery'

const deviceDiscovery = new DeviceDiscovery()

export function startUdpService() {
  deviceDiscovery.start()
}

export function stopUdpService() {
  deviceDiscovery.stop()
}
