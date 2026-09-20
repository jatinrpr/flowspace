import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import path from 'path'
import { env, isProduction } from './config/env.js'
import { errorHandler } from './middleware/error-handler.js'
import { notFound } from './middleware/not-found.js'
import { requestIdMiddleware } from './middleware/request-id.js'
import { requestLogger } from './middleware/request-logger.js'
import { securityHeaders, apiLimiter } from './middleware/security.js'
import { apiRouter } from './routes/index.js'

export const app = express()

if (isProduction) {
  app.set('trust proxy', 1)
}

app.disable('x-powered-by')
app.use(requestIdMiddleware)
app.use(securityHeaders)
app.use(requestLogger)
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
)

app.use('/api', apiLimiter)
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())
app.use(
  '/uploads',
  cors({ origin: env.frontendUrl, credentials: true }),
  (_req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    res.setHeader('Access-Control-Allow-Origin', env.frontendUrl)
    next()
  },
  express.static(path.join(process.cwd(), 'uploads')),
)
app.use('/api', apiRouter)
app.use(notFound)
app.use(errorHandler)
