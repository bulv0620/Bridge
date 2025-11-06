import { Aria2Server } from './core/Aria2Server'
import { MagnetWatcher } from './core/MagnetWatcher'

new Aria2Server()
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
