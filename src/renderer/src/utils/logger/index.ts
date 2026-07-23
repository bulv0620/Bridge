function serializeError(error: unknown): SerializedLogError | undefined {
  if (error == null) return undefined

  if (error instanceof Error) {
    const code = 'code' in error ? String(error.code) : undefined
    return {
      name: error.name || 'Error',
      message: error.message,
      stack: error.stack,
      code,
    }
  }

  return {
    name: 'Error',
    message: String(error),
  }
}

const pendingEntries: RendererLogInput[] = []
let retryTimer: number | undefined

function flushPending() {
  retryTimer = undefined
  if (!window.ipc?.log) {
    retryTimer = window.setTimeout(flushPending, 100)
    return
  }

  for (const entry of pendingEntries.splice(0)) {
    void window.ipc.log.write(entry).catch(() => undefined)
  }
}

function send(input: RendererLogInput) {
  try {
    if (!window.ipc?.log) {
      if (pendingEntries.length < 50) pendingEntries.push(input)
      if (retryTimer == null) retryTimer = window.setTimeout(flushPending, 100)
      return
    }
    void window.ipc.log.write(input).catch(() => undefined)
  } catch {
    // Logging must never interrupt the user operation that produced the event.
  }
}

export function createRendererLogger(scope: string) {
  return {
    debug(event: string, context?: Record<string, unknown>) {
      send({ level: 'debug', scope, event, context })
    },
    info(event: string, context?: Record<string, unknown>) {
      send({ level: 'info', scope, event, context })
    },
    warn(event: string, context?: Record<string, unknown>, error?: unknown) {
      send({ level: 'warn', scope, event, context, error: serializeError(error) })
    },
    error(event: string, error: unknown, context?: Record<string, unknown>) {
      send({ level: 'error', scope, event, context, error: serializeError(error) })
    },
  }
}

let handlersRegistered = false

export function registerRendererErrorHandlers() {
  if (handlersRegistered) return
  handlersRegistered = true
  const logger = createRendererLogger('renderer')

  window.addEventListener('error', (event) => {
    logger.error('renderer.uncaught_error', event.error ?? new Error(event.message), {
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('renderer.unhandled_rejection', event.reason)
  })
}
