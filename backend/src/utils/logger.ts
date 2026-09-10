import { isProduction } from '../config/env.js'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  timestamp?: string
  level: LogLevel
  requestId?: string
  message: string
  method?: string
  path?: string
  status?: number
  durationMs?: number
  error?: string
  metadata?: Record<string, unknown>
}

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'cookie',
  'secret',
  'jwt',
])

export function maskSensitiveData(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map(maskSensitiveData)
  }

  const masked: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase()
    if (SENSITIVE_KEYS.has(lowerKey)) {
      masked[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value)
    } else {
      masked[key] = value
    }
  }
  return masked
}

export function log(entry: LogEntry): void {
  const timestamp = new Date().toISOString()
  const payload: LogEntry = {
    ...entry,
    timestamp,
    metadata: entry.metadata ? (maskSensitiveData(entry.metadata) as Record<string, unknown>) : undefined,
  }

  const jsonString = JSON.stringify(payload)

  switch (entry.level) {
    case 'error':
      console.error(jsonString)
      break
    case 'warn':
      console.warn(jsonString)
      break
    case 'debug':
      if (!isProduction) console.debug(jsonString)
      break
    case 'info':
    default:
      console.info(jsonString)
      break
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log({ level: 'info', message, metadata: meta }),
  warn: (message: string, meta?: Record<string, unknown>) => log({ level: 'warn', message, metadata: meta }),
  error: (message: string, error?: unknown, meta?: Record<string, unknown>) =>
    log({
      level: 'error',
      message,
      error: error instanceof Error ? error.stack || error.message : String(error),
      metadata: meta,
    }),
  debug: (message: string, meta?: Record<string, unknown>) => log({ level: 'debug', message, metadata: meta }),
}
