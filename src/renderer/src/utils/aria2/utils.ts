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
