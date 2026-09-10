import { Server, Socket } from 'socket.io'
import * as messageService from '../services/message.service.js'

export const registerMessageHandlers = (io: Server, socket: Socket) => {
  const userId = socket.data.user.id

  socket.on('message:send', async (payload, callback) => {
    try {
      const message = await messageService.createMessage({
        channelId: payload.channelId,
        conversationId: payload.conversationId,
        senderId: userId,
        content: payload.content,
        type: payload.type,
        clientMessageId: payload.clientMessageId,
        mentionedUserIds: payload.mentionedUserIds
      })

      if (payload.channelId) {
        io.to(`channel:${payload.channelId}`).emit('message:new', message)
      } else if (payload.conversationId) {
        io.to(`conversation:${payload.conversationId}`).emit('message:new', message)
      }
      
      if (typeof callback === 'function') callback({ success: true, message })
    } catch (err: any) {
      if (typeof callback === 'function') callback({ success: false, error: err.message })
    }
  })

  socket.on('message:edit', async (payload, callback) => {
    try {
      const message = await messageService.updateMessage(payload.messageId, userId, payload.content)
      
      if (message.channelId) {
        io.to(`channel:${message.channelId}`).emit('message:updated', message)
      } else if (message.conversationId) {
        io.to(`conversation:${message.conversationId}`).emit('message:updated', message)
      }
      
      if (typeof callback === 'function') callback({ success: true, message })
    } catch (err: any) {
      if (typeof callback === 'function') callback({ success: false, error: err.message })
    }
  })

  socket.on('message:delete', async (payload, callback) => {
    try {
      const message = await messageService.deleteMessage(payload.messageId, userId)
      
      const broadcastPayload = { messageId: message.id, deletedAt: message.deletedAt }
      
      if (message.channelId) {
        io.to(`channel:${message.channelId}`).emit('message:deleted', broadcastPayload)
      } else if (message.conversationId) {
        io.to(`conversation:${message.conversationId}`).emit('message:deleted', broadcastPayload)
      }
      
      if (typeof callback === 'function') callback({ success: true })
    } catch (err: any) {
      if (typeof callback === 'function') callback({ success: false, error: err.message })
    }
  })
}
