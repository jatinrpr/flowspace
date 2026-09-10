import { Prisma } from '@prisma/client'
import type { ErrorRequestHandler } from 'express'
import { isProduction } from '../config/env.js'
import type { ApiErrorResponse } from '../types/api.js'
import { AppError } from '../utils/app-error.js'
import { ZodError } from 'zod'
import { errorReporter } from '../services/error-reporter.js'

export const errorHandler: ErrorRequestHandler = (
  error,
  request,
  response,
  next,
) => {
  void next
  let statusCode = 500
  let message = 'Something went wrong'

  errorReporter.captureException(error, {
    requestId: request.requestId,
    userId: request.auth?.userId,
    action: `${request.method} ${request.originalUrl}`,
  })

  if (error instanceof AppError) {
    statusCode = error.statusCode
    message = error.message
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = error.code === 'P2002' ? 409 : 400
    message =
      error.code === 'P2002'
        ? 'A record with this value already exists'
        : 'Database request failed'
  } else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400
    message = 'Malformed JSON request body'
  } else if (error instanceof ZodError) {
    statusCode = 400
    message = error.issues[0]?.message ?? 'Validation failed'
  } else if (!isProduction && error instanceof Error) {
    message = error.message
  }

  const body: ApiErrorResponse = { success: false, message }
  response.status(statusCode).json(body)
}
