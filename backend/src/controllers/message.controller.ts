import type { RequestHandler } from 'express'
import { z } from 'zod'
import * as messageService from '../services/message.service.js'

const getMessagesSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50)
})

export const getChannelMessages: RequestHandler<{ channelId: string }> = async (req, res) => {
  const { cursor, limit } = getMessagesSchema.parse(req.query)
  const result = await messageService.getMessages({
    channelId: req.params.channelId,
    userId: req.auth!.userId,
    cursor,
    limit
  })
  res.status(200).json({ success: true, ...result })
}

export const getConversationMessages: RequestHandler<{ conversationId: string }> = async (req, res) => {
  const { cursor, limit } = getMessagesSchema.parse(req.query)
  const result = await messageService.getMessages({
    conversationId: req.params.conversationId,
    userId: req.auth!.userId,
    cursor,
    limit
  })
  res.status(200).json({ success: true, ...result })
}

export const updateMessage: RequestHandler<{ messageId: string }> = async (req, res, next) => {
  try {
    const { content } = req.body
    const message = await messageService.updateMessage(req.params.messageId, req.auth!.userId, content)
    
    import('../sockets/index.js').then(({ io: socketIo }) => {
      socketIo.emit('message:updated', message)
    })
    
    res.status(200).json({ success: true, message })
  } catch (error) {
    next(error)
  }
}

export const deleteMessage: RequestHandler<{ messageId: string }> = async (req, res, next) => {
  try {
    const message = await messageService.deleteMessage(req.params.messageId, req.auth!.userId)
    
    import('../sockets/index.js').then(({ io: socketIo }) => {
      socketIo.emit('message:deleted', { id: message.id })
    })
    
    res.status(200).json({ success: true, message })
  } catch (error) {
    next(error)
  }
}
