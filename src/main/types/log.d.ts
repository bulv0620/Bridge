declare type LogLevel = 'info' | 'debug'
declare type LogSeverity = 'error' | 'warn' | 'info' | 'debug'
declare type LogProcess = 'main' | 'renderer' | 'preload' | 'child'

declare interface SerializedLogError {
  name: string
  message: string
  stack?: string
  code?: string
}

declare interface RendererLogInput {
  level: LogSeverity
  scope: string
  event: string
  context?: Record<string, unknown>
  error?: SerializedLogError
}

declare interface DiagnosticsStatus {
  directory: string
  sizeBytes: number
}

declare interface DiagnosticsExportResult {
  cancelled: boolean
}
