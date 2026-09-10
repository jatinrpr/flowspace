import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import * as huddleController from '../controllers/huddle.controller.js'

export const huddleRouter = Router()
huddleRouter.use(requireAuth)

huddleRouter.get('/ice-servers', huddleController.getIceServers)
huddleRouter.get('/channel/:channelId', huddleController.getChannelHuddle)
huddleRouter.get('/conversation/:conversationId', huddleController.getConversationHuddle)
