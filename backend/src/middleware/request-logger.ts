import type { RequestHandler } from 'express'
import { log } from '../utils/logger.js'

export const requestLogger: RequestHandler = (request, response, next) => {
  const startedAt = Date.now()

  response.on('finish', () => {
    const durationMs = Date.now() - startedAt
    log({
      level: response.statusCode >= 500 ? 'error' : response.statusCode >= 400 ? 'warn' : 'info',
      requestId: request.requestId,
      message: `${request.method} ${request.originalUrl}`,
      method: request.method,
      path: request.originalUrl,
      status: response.statusCode,
      durationMs,
    })
  })

  next()
}
