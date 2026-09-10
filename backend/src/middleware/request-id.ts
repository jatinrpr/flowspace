import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { v4 as uuidv4 } from 'uuid'

declare global {
  namespace Express {
    interface Request {
      requestId?: string
    }
  }
}

export const requestIdMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const existingId = req.headers['x-request-id']
  const requestId = typeof existingId === 'string' && existingId.trim() ? existingId : uuidv4()

  req.requestId = requestId
  res.setHeader('X-Request-ID', requestId)
  next()
}
