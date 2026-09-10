import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { handleSearchMessages } from '../controllers/search.controller.js'

export const searchRouter = Router({ mergeParams: true })

searchRouter.use(requireAuth)
searchRouter.get('/messages', handleSearchMessages)
