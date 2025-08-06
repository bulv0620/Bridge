export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]
}

export function formatTimeLeft(seconds: number): string {
  if (!isFinite(seconds)) return '-'
  const s = Math.floor(seconds % 60)
  const m = Math.floor((seconds / 60) % 60)
  const h = Math.floor(seconds / 3600)
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function formatBytesPerSecond(bytesPerSecond: string | number): string {
  const speed = typeof bytesPerSecond === 'string' ? parseInt(bytesPerSecond) : bytesPerSecond

  if (isNaN(speed) || speed < 0) return '0 B/s'

  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s']
  let index = 0
  let value = speed

  while (value >= 1024 && index < units.length - 1) {
    value = value / 1024
    index++
  }

  return `${value.toFixed(2)} ${units[index]}`
}

export function formatTimeDifference(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  function pad(n: number) {
    return n.toString().padStart(2, '0')
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}
