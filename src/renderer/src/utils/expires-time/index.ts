export const expireTypeOptions = [
  {
    label: '1 min',
    value: '1min',
  },
  {
    label: '5 min',
    value: '5min',
  },
  {
    label: '15 min',
    value: '15min',
  },
  {
    label: '30 min',
    value: '30min',
  },
  {
    label: '1 h',
    value: '1h',
  },
]

export function getExpireTime(value: string): number {
  const now = Date.now()
  const unitMap: Record<string, number> = {
    min: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }

  const match = value.match(/^(\d+)(min|h|d)$/)
  if (!match) return now

  const [, num, unit] = match
  const duration = parseInt(num) * unitMap[unit]
  return now + duration
}
