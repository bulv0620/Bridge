import { i18n } from '@renderer/locales'
import { formatBytes, formatBytesPerSecond, formatTimeLeft } from '../format'

const { t } = i18n.global

export function getTaskStatus(row: Aria2Status) {
  const statusMap = {
    active: { type: 'primary', label: t('views.downloader.downloading') },
    waiting: { type: 'warning', label: t('views.downloader.waiting') },
    complete: { type: 'success', label: t('views.downloader.completed') },
    paused: { type: 'info', label: t('views.downloader.paused') },
    error: { type: 'danger', label: t('views.downloader.error') },
    removed: { type: 'danger', label: t('views.downloader.removed') },
    seeding: { type: 'primary', label: t('views.downloader.seeding') },
  }
  let info: { type: string; label: string }
  if (
    row.status === 'active' &&
    Number(row.totalLength) > 0 &&
    row.completedLength === row.totalLength
  ) {
    info = statusMap['seeding']
  } else {
    info = statusMap[row.status] || { type: 'default', label: row.status }
  }

  return info
}

export function getTaskPercentage(row: Aria2Status) {
  if (Number(row.totalLength) === 0) return 0
  return Math.floor((Number(row.completedLength) / Number(row.totalLength)) * 100)
}

export function getTaskSize(row: Aria2Status) {
  return `${formatBytes(Number(row.completedLength))}/${formatBytes(Number(row.totalLength))}`
}

export function getTaskSpeed(row: Aria2Status) {
  return formatBytesPerSecond(Number(row.downloadSpeed))
}

export function getTaskTimeLeft(row: Aria2Status) {
  if (Number(row.downloadSpeed) === 0 || Number(row.totalLength) === 0) return '-'
  const remaining = Number(row.totalLength) - Number(row.completedLength)
  return formatTimeLeft(remaining / Number(row.downloadSpeed))
}
