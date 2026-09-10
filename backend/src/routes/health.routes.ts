import { Router } from 'express'
import { getHealth, getReady } from '../controllers/health.controller.js'

export const healthRouter = Router()

healthRouter.get('/', getHealth)
healthRouter.get('/ready', getReady)
