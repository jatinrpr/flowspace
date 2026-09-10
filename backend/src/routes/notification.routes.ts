import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import * as controller from '../controllers/notification.controller.js'

export const notificationRouter = Router()

notificationRouter.use(requireAuth)

notificationRouter.get('/', controller.getNotifications)
notificationRouter.get('/unread-count', controller.getUnreadCount)
notificationRouter.patch('/read-all', controller.markAllAsRead)
notificationRouter.patch('/:id/read', controller.markAsRead)
