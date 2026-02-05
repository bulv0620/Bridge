import { getStore } from '../store'
import { remoteRef } from '../utils/remoteRef'
import os from 'os'

const store = getStore()

export const deviceId = remoteRef('device-id', store.get('deviceId'))
export const deviceName = remoteRef('device-name', store.get('deviceName'))

export function initDeviceConfig() {
  if (!deviceId.value) {
    deviceId.value = crypto.randomUUID()
    store.set('deviceId', deviceId.value)
  }

  if (!deviceName.value) {
    deviceName.value = os.hostname()
    store.set('deviceName', deviceName.value)
  }
}
