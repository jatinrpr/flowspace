import { RequestHandler } from 'express'
import * as threadService from '../services/thread.service.js'
import { io } from '../sockets/index.js'
import { prisma } from '../lib/prisma.js'

export const getThread: RequestHandler<{ messageId: string }> = async (req, res, next) => {
  try {
    const thread = await threadService.getThread(req.params.messageId, req.auth!.userId)
    res.status(200).json({ success: true, thread })
  } catch (error) {
    next(error)
  }
}

export const createReply: RequestHandler<{ messageId: string }> = async (req, res, next) => {
  try {
    const { content, type } = req.body
    const reply = await threadService.createReply(req.params.messageId, req.auth!.userId, content, type)
    
    const message = await prisma.message.findUnique({ where: { id: req.params.messageId } })
    if (message) {
      const payload = { parentMessageId: req.params.messageId, reply, roomId: message.channelId || message.conversationId }
      
      if (message.channelId) io.to(`channel:${message.channelId}`).emit('thread:reply:new', payload)
      else if (message.conversationId) io.to(`conversation:${message.conversationId}`).emit('thread:reply:new', payload)
    }

    res.status(201).json({ success: true, reply })
  } catch (error) {
    next(error)
  }
}
