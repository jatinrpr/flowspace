import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import * as threadController from '../controllers/thread.controller.js'

export const threadRouter = Router({ mergeParams: true })

threadRouter.use(requireAuth)
threadRouter.get('/', threadController.getThread)
threadRouter.post('/', threadController.createReply)
