import os from 'os'
import path from 'path'

const MAX_DEPTH = 5
const MAX_KEYS = 50
const MAX_ARRAY_LENGTH = 50
const MAX_STRING_LENGTH = 2048
const MAX_CONTEXT_BYTES = 32 * 1024

const pathKeyPattern = /path|file(name)?|directory|dir/i
const credentialPattern =
  /((?:password|passwd|secret(?:[_-]?access)?[_-]?key|secret|access[_-]?key(?:[_-]?id)?|token|authorization|cookie)\s*[:=]\s*)([^\s,;]+)/gi

function isSensitiveKey(key: string) {
  const normalized = key.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
  if (/password|passwd|secret|access_?key|token|authorization|cookie|proxy_?url/.test(normalized)) {
    return true
  }

  return [
    'clipboard',
    'clipboard_content',
    'clipboard_history',
    'content',
    'text',
    'html',
    'body',
  ].includes(normalized)
}

function truncate(value: string, maxLength = MAX_STRING_LENGTH) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength)}…[truncated]`
}

function sanitizeUrl(value: string) {
  try {
    const url = new URL(value)
    return `${url.protocol}//[HOST]${url.pathname}`
  } catch {
    return value
  }
}

export function redactPath(value: string) {
  const normalized = value.replaceAll('\\', '/')
  const home = os.homedir().replaceAll('\\', '/')
  const withoutHome = normalized.startsWith(home) ? normalized.slice(home.length) : normalized
  const parsedRoot = path.parse(withoutHome).root.replaceAll('\\', '/')
  const withoutRoot = parsedRoot ? withoutHome.slice(parsedRoot.length) : withoutHome
  const segments = withoutRoot.split('/').filter(Boolean)

  if (segments.length <= 3) return segments.join('/')
  return `…/${segments.slice(-3).join('/')}`
}

function sanitizeString(value: string, key?: string) {
  let result = value
    .replace(credentialPattern, '$1[REDACTED]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]')

  result = result.replace(/https?:\/\/[^\s"'<>]+/gi, (url) => sanitizeUrl(url))

  if (key && pathKeyPattern.test(key)) {
    result = redactPath(result)
  } else {
    const home = os.homedir()
    if (home && result.includes(home)) {
      result = result.replaceAll(home, '[USER_HOME]')
    }
  }

  return truncate(result)
}

function sanitizeValue(
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
  key?: string,
): unknown {
  if (key && isSensitiveKey(key)) return '[REDACTED]'
  if (value == null || typeof value === 'number' || typeof value === 'boolean') return value
  if (typeof value === 'bigint') return value.toString()
  if (typeof value === 'string') return sanitizeString(value, key)
  if (typeof value === 'function' || typeof value === 'symbol') return String(value)
  if (depth >= MAX_DEPTH) return '[MAX_DEPTH]'

  if (value instanceof Date) return value.toISOString()
  if (value instanceof Error) return sanitizeError(value)
  if (Buffer.isBuffer(value)) return `[Buffer ${value.length} bytes]`
  if (typeof value !== 'object') return String(value)
  if (seen.has(value)) return '[CIRCULAR]'

  seen.add(value)

  if (Array.isArray(value)) {
    const result = value
      .slice(0, MAX_ARRAY_LENGTH)
      .map((item) => sanitizeValue(item, depth + 1, seen))
    if (value.length > MAX_ARRAY_LENGTH) result.push(`[${value.length - MAX_ARRAY_LENGTH} more]`)
    return result
  }

  const result: Record<string, unknown> = {}
  const entries = Object.entries(value).slice(0, MAX_KEYS)
  for (const [entryKey, entryValue] of entries) {
    result[entryKey] = sanitizeValue(entryValue, depth + 1, seen, entryKey)
  }
  if (Object.keys(value).length > MAX_KEYS) {
    result.__truncatedKeys = Object.keys(value).length - MAX_KEYS
  }
  return result
}

export function sanitizeContext(context?: Record<string, unknown>) {
  if (!context) return undefined

  const sanitized = sanitizeValue(context, 0, new WeakSet()) as Record<string, unknown>
  const serialized = JSON.stringify(sanitized)
  if (Buffer.byteLength(serialized) <= MAX_CONTEXT_BYTES) return sanitized

  return {
    truncated: true,
    originalBytes: Buffer.byteLength(serialized),
  }
}

export function sanitizeError(error: unknown): SerializedLogError | undefined {
  if (error == null) return undefined

  if (error instanceof Error) {
    const code = 'code' in error ? String(error.code) : undefined
    return {
      name: sanitizeString(error.name || 'Error'),
      message: sanitizeString(error.message),
      stack: error.stack ? sanitizeString(error.stack, undefined) : undefined,
      code: code ? sanitizeString(code) : undefined,
    }
  }

  if (typeof error === 'object') {
    const input = error as Partial<SerializedLogError>
    return {
      name: sanitizeString(String(input.name || 'Error')),
      message: sanitizeString(String(input.message || error)),
      stack: input.stack ? sanitizeString(String(input.stack)) : undefined,
      code: input.code ? sanitizeString(String(input.code)) : undefined,
    }
  }

  return {
    name: 'Error',
    message: sanitizeString(String(error)),
  }
}

export function shortId(value?: string) {
  if (!value) return undefined
  if (value.length <= 8) return value
  return `${value.slice(0, 8)}…`
}
