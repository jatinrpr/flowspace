import { Router } from 'express'
import { authRouter } from './auth.routes.js'
import { healthRouter } from './health.routes.js'
import { workspaceRouter } from './workspace.routes.js'
import { channelRouter } from './channel.routes.js'
import { conversationRouter } from './conversation.routes.js'
import { messageRouter } from './message.routes.js'
import { notificationRouter } from './notification.routes.js'
import { huddleRouter } from './huddle.routes.js'

export const apiRouter = Router()

apiRouter.use('/auth', authRouter)
apiRouter.use('/health', healthRouter)
apiRouter.use('/workspaces', workspaceRouter)
apiRouter.use('/channels', channelRouter)
apiRouter.use('/conversations', conversationRouter)
apiRouter.use('/messages', messageRouter)
apiRouter.use('/notifications', notificationRouter)
apiRouter.use('/huddles', huddleRouter)

