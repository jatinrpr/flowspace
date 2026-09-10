import type { RequestHandler } from 'express'
import * as notificationService from '../services/notification.service.js'

export const getUnreadCount: RequestHandler = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.auth!.userId)
    res.json({ success: true, count })
  } catch (error) {
    next(error)
  }
}

export const getNotifications: RequestHandler = async (req, res, next) => {
  try {
    const { limit, cursor } = req.query
    let parsedLimit = 20
    if (typeof limit === 'string') {
      parsedLimit = parseInt(limit, 10)
      if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 100) parsedLimit = 20
    }
    
    const result = await notificationService.getNotifications(
      req.auth!.userId,
      parsedLimit,
      typeof cursor === 'string' ? cursor : undefined
    )
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

export const markAsRead: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const notif = await notificationService.markAsRead(req.auth!.userId, req.params.id)
    res.json({ success: true, notification: notif })
  } catch (error) {
    next(error)
  }
}

export const markAllAsRead: RequestHandler = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.auth!.userId)
    res.json({ success: true, message: 'All notifications marked as read' })
  } catch (error) {
    next(error)
  }
}
