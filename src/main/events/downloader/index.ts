import { IpcMainInvokeEvent } from 'electron'
import { Aria2Server } from './core/Aria2Server'
import { MagnetWatcher } from './core/MagnetWatcher'

const aria2Server = new Aria2Server()
const magnetWatcher = new MagnetWatcher()

export function startMagnetWatcher() {
  magnetWatcher.start(2000)
}

export function stopMagnetWatcher() {
  magnetWatcher.stop()
}

export function getMagnetWatcherStatus() {
  return magnetWatcher.getStatus()
}

export function getSettings() {
  return aria2Server.getAria2Settings()
}

export function saveSettings(_: IpcMainInvokeEvent, settings: Aria2GlobalOption) {
  return aria2Server.saveAria2Settings(settings)
}
