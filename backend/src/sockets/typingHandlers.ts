import { Server, Socket } from 'socket.io'
import { authorizeChannelMessageAccess, authorizeConversationMessageAccess } from '../services/message.service.js'

export const registerTypingHandlers = (_io: Server, socket: Socket) => {
  const user = socket.data.user

  socket.on('typing:start', async (payload) => {
    try {
      if (payload.channelId) {
        await authorizeChannelMessageAccess(payload.channelId, user.id)
        socket.to(`channel:${payload.channelId}`).emit('typing:start', {
          userId: user.id,
          userName: user.name,
          channelId: payload.channelId
        })
      } else if (payload.conversationId) {
        await authorizeConversationMessageAccess(payload.conversationId, user.id)
        socket.to(`conversation:${payload.conversationId}`).emit('typing:start', {
          userId: user.id,
          userName: user.name,
          conversationId: payload.conversationId
        })
      }
    } catch (err) {
      // Ignore unauthorized typing events
    }
  })

  socket.on('typing:stop', async (payload) => {
    try {
      if (payload.channelId) {
        socket.to(`channel:${payload.channelId}`).emit('typing:stop', {
          userId: user.id,
          channelId: payload.channelId
        })
      } else if (payload.conversationId) {
        socket.to(`conversation:${payload.conversationId}`).emit('typing:stop', {
          userId: user.id,
          conversationId: payload.conversationId
        })
      }
    } catch (err) {
      // Ignore
    }
  })
}
