import { logger } from '../utils/logger.js'

export interface ErrorContext {
  requestId?: string
  userId?: string
  workspaceId?: string
  action?: string
  extra?: Record<string, unknown>
}

export class ErrorReporter {
  private static instance: ErrorReporter

  private constructor() {}

  public static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter()
    }
    return ErrorReporter.instance
  }

  public captureException(error: unknown, context?: ErrorContext): void {
    const errMessage = error instanceof Error ? error.message : String(error)
    logger.error(`[ErrorReporter] Exception captured: ${errMessage}`, error, {
      requestId: context?.requestId,
      userId: context?.userId,
      workspaceId: context?.workspaceId,
      action: context?.action,
      ...context?.extra,
    })
    // Hook point for Sentry / Datadog / OpenTelemetry if configured in production
  }

  public captureMessage(message: string, level: 'info' | 'warn' | 'error' = 'info', context?: ErrorContext): void {
    logger.info(`[ErrorReporter] Message captured (${level}): ${message}`, {
      level,
      requestId: context?.requestId,
      userId: context?.userId,
      workspaceId: context?.workspaceId,
      ...context?.extra,
    })
  }
}

export const errorReporter = ErrorReporter.getInstance()
