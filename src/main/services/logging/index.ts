import { app } from 'electron'
import electronLog from 'electron-log'
import fs from 'fs'
import path from 'path'
import { is } from '@electron-toolkit/utils'
import { getStore } from '../../store'
import { sanitizeContext, sanitizeError } from './sanitizer'

const MAX_LOG_SIZE = 5 * 1024 * 1024
const MAX_ARCHIVES = 4
const LOG_FILE_NAME = 'bridge.log'
const LOG_FILE_PATTERN = /^bridge(?:\.[1-4])?\.log$/

let initialized = false
let currentLevel: LogLevel = 'info'
let logDirectory = ''

interface LogEntry {
  time: string
  level: LogSeverity
  process: LogProcess
  scope: string
  event: string
  context?: Record<string, unknown>
  error?: SerializedLogError
}

export interface AppLogger {
  debug(event: string, context?: Record<string, unknown>): void
  info(event: string, context?: Record<string, unknown>): void
  warn(event: string, context?: Record<string, unknown>, error?: unknown): void
  error(event: string, error: unknown, context?: Record<string, unknown>): void
}

function localIsoTime(date = new Date()) {
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const offset = Math.abs(offsetMinutes)
  const pad = (value: number, length = 2) => String(value).padStart(length, '0')

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `.${pad(date.getMilliseconds(), 3)}${sign}${pad(Math.floor(offset / 60))}:${pad(offset % 60)}`
  )
}

function archivePath(index: number) {
  return path.join(logDirectory, `bridge.${index}.log`)
}

function rotateLogFile(filePath: string) {
  try {
    fs.rmSync(archivePath(MAX_ARCHIVES), { force: true })
    for (let index = MAX_ARCHIVES - 1; index >= 1; index--) {
      const source = archivePath(index)
      if (fs.existsSync(source)) fs.renameSync(source, archivePath(index + 1))
    }
    if (fs.existsSync(filePath)) fs.renameSync(filePath, archivePath(1))
  } catch (error) {
    electronLog.transports.console.writeFn({
      message: {
        data: ['Failed to rotate Bridge log', error],
        date: new Date(),
        level: 'error',
      },
    })
    electronLog.transports.file.getFile().clear()
  }
}

export function initializeLogging() {
  if (initialized) return

  app.setAppLogsPath()
  logDirectory = app.getPath('logs')
  fs.mkdirSync(logDirectory, { recursive: true })

  electronLog.transports.file.resolvePathFn = () => path.join(logDirectory, LOG_FILE_NAME)
  electronLog.transports.file.maxSize = MAX_LOG_SIZE
  electronLog.transports.file.level = 'debug'
  electronLog.transports.file.sync = true
  electronLog.transports.file.format = ({ data }) => data
  electronLog.transports.file.archiveLogFn = (file) => rotateLogFile(file.path)
  electronLog.transports.console.level = is.dev ? 'debug' : false
  electronLog.transports.console.format = '[{h}:{i}:{s}.{ms}] [{level}] {text}'

  currentLevel = getStore().get('logLevel')
  initialized = true
  createLogger('app').info('app.logging.initialized', {
    level: currentLevel,
    version: app.getVersion(),
  })
}

export function setLogLevel(level: LogLevel) {
  currentLevel = level
  if (initialized) {
    createLogger('app').info('app.logging.level_changed', { level })
  }
}

export function getLogLevel() {
  return currentLevel
}

function write(
  processType: LogProcess,
  scope: string,
  level: LogSeverity,
  event: string,
  context?: Record<string, unknown>,
  error?: unknown,
) {
  if (!initialized) initializeLogging()
  if (level === 'debug' && currentLevel !== 'debug') return

  const entry: LogEntry = {
    time: localIsoTime(),
    level,
    process: processType,
    scope,
    event,
    context: sanitizeContext(context),
    error: sanitizeError(error),
  }

  if (!entry.context) delete entry.context
  if (!entry.error) delete entry.error

  electronLog[level](JSON.stringify(entry))
}

export function createLogger(scope: string, processType: LogProcess = 'main'): AppLogger {
  return {
    debug: (event, context) => write(processType, scope, 'debug', event, context),
    info: (event, context) => write(processType, scope, 'info', event, context),
    warn: (event, context, error) => write(processType, scope, 'warn', event, context, error),
    error: (event, error, context) => write(processType, scope, 'error', event, context, error),
  }
}

export function writeRendererLog(input: RendererLogInput) {
  write('renderer', input.scope, input.level, input.event, input.context, input.error)
}

export function getLogDirectory() {
  if (!initialized) initializeLogging()
  return logDirectory
}

export function getLogFiles() {
  const directory = getLogDirectory()
  return fs
    .readdirSync(directory)
    .filter((fileName) => LOG_FILE_PATTERN.test(fileName))
    .sort()
    .map((fileName) => path.join(directory, fileName))
}

export function getLogSize() {
  return getLogFiles().reduce((total, filePath) => {
    try {
      return total + fs.statSync(filePath).size
    } catch {
      return total
    }
  }, 0)
}

export function clearLogFiles() {
  const currentPath = path.join(getLogDirectory(), LOG_FILE_NAME)
  electronLog.transports.file.getFile().clear()

  for (let index = 1; index <= MAX_ARCHIVES; index++) {
    fs.rmSync(archivePath(index), { force: true })
  }

  if (!fs.existsSync(currentPath)) fs.writeFileSync(currentPath, '')
  createLogger('diagnostics').info('logs.cleared')
}

let globalHandlersRegistered = false

export function registerGlobalErrorHandlers() {
  if (globalHandlersRegistered) return
  globalHandlersRegistered = true
  const logger = createLogger('app')

  process.on('uncaughtExceptionMonitor', (error, origin) => {
    logger.error('app.uncaught_exception', error, { origin })
  })

  process.on('unhandledRejection', (reason) => {
    logger.error('app.unhandled_rejection', reason)
  })

  app.on('render-process-gone', (_event, webContents, details) => {
    logger.error('app.renderer_process_gone', new Error(details.reason), {
      webContentsId: webContents.id,
      reason: details.reason,
      exitCode: details.exitCode,
    })
  })

  app.on('child-process-gone', (_event, details) => {
    logger.error('app.child_process_gone', new Error(details.reason), {
      type: details.type,
      reason: details.reason,
      exitCode: details.exitCode,
      serviceName: details.serviceName,
    })
  })
}

export { redactPath, sanitizeError, shortId } from './sanitizer'
