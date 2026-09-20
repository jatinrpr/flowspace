import type { RequestHandler } from 'express'
import { AppError } from '../utils/app-error.js'
import { verifyAccessToken } from '../utils/token.js'

export const requireAuth: RequestHandler = (request, _response, next) => {
  const authHeader = request.headers.authorization
  const headerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : undefined
  const token = headerToken || (request.cookies.access_token as string | undefined)

  if (!token) {
    next(new AppError('Authentication required', 401))
    return
  }

  try {
    request.auth = { userId: verifyAccessToken(token).sub }
    next()
  } catch {
    next(new AppError('Authentication required', 401))
  }
}
