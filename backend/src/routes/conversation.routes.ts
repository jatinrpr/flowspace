import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import * as conversationController from '../controllers/conversation.controller.js'

export const conversationRouter = Router()

conversationRouter.use(requireAuth)

conversationRouter.get('/:conversationId', conversationController.getConversation)
conversationRouter.delete('/:conversationId', conversationController.deleteConversation)

conversationRouter.post('/:conversationId/members', conversationController.addConversationMember)
conversationRouter.delete('/:conversationId/members/:userId', conversationController.removeConversationMember)

import * as messageController from '../controllers/message.controller.js'
conversationRouter.get('/:conversationId/messages', messageController.getConversationMessages)
