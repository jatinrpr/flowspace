import { RequestHandler } from 'express'
import * as reactionService from '../services/reaction.service.js'
import { io } from '../sockets/index.js'
import { prisma } from '../lib/prisma.js'

export const addReaction: RequestHandler<{ messageId: string }> = async (req, res, next) => {
  try {
    const { messageId } = req.params
    const { emoji } = req.body
    const userId = req.auth!.userId

    const reaction = await reactionService.addReaction(messageId, userId, emoji)
    
    const message = await prisma.message.findUnique({ where: { id: messageId } })
    if (message) {
      const payload = { messageId, reaction, roomId: message.channelId || message.conversationId }
      if (message.channelId) io.to(`channel:${message.channelId}`).emit('reaction:added', payload)
      else if (message.conversationId) io.to(`conversation:${message.conversationId}`).emit('reaction:added', payload)
    }

    res.status(201).json({ success: true, reaction })
  } catch (error) {
    next(error)
  }
}

export const removeReaction: RequestHandler<{ messageId: string, emoji: string }> = async (req, res, next) => {
  try {
    const { messageId, emoji } = req.params
    const userId = req.auth!.userId

    const removed = await reactionService.removeReaction(messageId, userId, emoji)
    
    if (removed) {
      const message = await prisma.message.findUnique({ where: { id: messageId } })
      if (message) {
        const payload = { messageId, reactionId: removed.id, emoji, userId, roomId: message.channelId || message.conversationId }
        if (message.channelId) io.to(`channel:${message.channelId}`).emit('reaction:removed', payload)
        else if (message.conversationId) io.to(`conversation:${message.conversationId}`).emit('reaction:removed', payload)
      }
    }

    res.status(200).json({ success: true })
  } catch (error) {
    next(error)
  }
}
