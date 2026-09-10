import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import * as channelController from '../controllers/channel.controller.js'

export const channelRouter = Router()

channelRouter.use(requireAuth)

// These routes don't necessarily have a workspace ID in the path (they operate on channel ID directly)
channelRouter.get('/:channelId', channelController.getChannel)
channelRouter.patch('/:channelId', channelController.updateChannel)
channelRouter.delete('/:channelId', channelController.deleteChannel)

channelRouter.get('/:channelId/members', channelController.getChannelMembers)
channelRouter.post('/:channelId/members', channelController.addChannelMember)
channelRouter.delete('/:channelId/members/:userId', channelController.removeChannelMember)

import * as messageController from '../controllers/message.controller.js'
channelRouter.get('/:channelId/messages', messageController.getChannelMessages)
