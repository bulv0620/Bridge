import { MagnetWatcher } from './utils/MagnetWatcher'

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
