import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import * as messageController from '../controllers/message.controller.js'
import { reactionRouter } from './reaction.routes.js'
import { threadRouter } from './thread.routes.js'
import { fileRouter } from './file.routes.js'

export const messageRouter = Router()

messageRouter.use(requireAuth)

messageRouter.patch('/:messageId', messageController.updateMessage)
messageRouter.delete('/:messageId', messageController.deleteMessage)

messageRouter.use('/:messageId/reactions', reactionRouter)
messageRouter.use('/:messageId/thread', threadRouter)
messageRouter.use('/:messageId/files', fileRouter)
