import { IpcMainInvokeEvent } from 'electron'
import { clearLogFiles, createLogger, writeRendererLog } from '../../services/logging'
import {
  exportDiagnostics as exportDiagnosticsFile,
  getDiagnosticsStatus as readDiagnosticsStatus,
  openLogDirectory,
} from '../../services/logging/diagnostics'

const logger = createLogger('ipc')
const rendererRateLimits = new Map<number, { startedAt: number; count: number; warned: boolean }>()
const RATE_LIMIT_WINDOW_MS = 10_000
const RATE_LIMIT_MAX = 200

function isRateLimited(senderId: number) {
  const now = Date.now()
  let state = rendererRateLimits.get(senderId)

  if (!state || now - state.startedAt >= RATE_LIMIT_WINDOW_MS) {
    state = { startedAt: now, count: 0, warned: false }
    rendererRateLimits.set(senderId, state)
  }

  state.count++
  if (state.count <= RATE_LIMIT_MAX) return false

  if (!state.warned) {
    state.warned = true
    logger.warn('renderer.logs.rate_limited', { senderId })
  }
  return true
}

function normalizeName(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== 'string') return fallback
  const normalized = value.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, maxLength)
  return normalized || fallback
}

export function write(event: IpcMainInvokeEvent, input: RendererLogInput) {
  if (!input || typeof input !== 'object' || isRateLimited(event.sender.id)) return
  if (!['error', 'warn', 'info', 'debug'].includes(input.level)) return

  writeRendererLog({
    level: input.level,
    scope: normalizeName(input.scope, 'renderer', 40),
    event: normalizeName(input.event, 'renderer.event', 100),
    context:
      input.context && typeof input.context === 'object' && !Array.isArray(input.context)
        ? input.context
        : undefined,
    error: input.error,
  })
}

export function getDiagnosticsStatus(_: IpcMainInvokeEvent) {
  return readDiagnosticsStatus()
}

export function openDirectory(_: IpcMainInvokeEvent) {
  return openLogDirectory()
}

export function exportDiagnostics(_: IpcMainInvokeEvent) {
  return exportDiagnosticsFile()
}

export function clear(_: IpcMainInvokeEvent) {
  clearLogFiles()
}
