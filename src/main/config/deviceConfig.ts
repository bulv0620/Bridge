import { getStore } from '../store'
import { remoteRef } from '../utils/remoteRef'
import os from 'os'

const store = getStore()

remoteRef('device-id', initDeviceId())
remoteRef('device-name', initDeviceName())

function initDeviceId() {
  let id = store.get('deviceId')
  if (!id) {
    id = crypto.randomUUID()
    store.set('deviceId', id)
  }

  return id
}

function initDeviceName() {
  let name = store.get('deviceName')
  if (!name) {
    name = os.hostname()
    store.set('deviceName', name)
  }

  return name
}
