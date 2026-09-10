import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import * as reactionController from '../controllers/reaction.controller.js'

export const reactionRouter = Router({ mergeParams: true })

reactionRouter.use(requireAuth)
reactionRouter.post('/', reactionController.addReaction)
reactionRouter.delete('/:emoji', reactionController.removeReaction)
