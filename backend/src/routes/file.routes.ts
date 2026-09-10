import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import * as fileController from '../controllers/file.controller.js'

export const fileRouter = Router({ mergeParams: true })

fileRouter.use(requireAuth)
fileRouter.post('/', fileController.upload.single('file'), fileController.uploadFile)
