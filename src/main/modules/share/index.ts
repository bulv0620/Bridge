import { DeviceDiscovery } from './service/DeviceDiscovery'

let deviceDiscovery: DeviceDiscovery | null

export function startUdpService() {
  if (!deviceDiscovery) {
    deviceDiscovery = new DeviceDiscovery()
  }
  deviceDiscovery.start()
}

export function stopUdpService() {
  if (!deviceDiscovery) return
  deviceDiscovery.stop()
}
