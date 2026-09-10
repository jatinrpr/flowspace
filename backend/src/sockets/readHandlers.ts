import { Server, Socket } from 'socket.io'
import { prisma } from '../lib/prisma.js'

export const registerReadHandlers = (io: Server, socket: Socket) => {
  const userId = socket.data.user.id

  socket.on('message:read', async (payload) => {
    try {
      const { channelId, conversationId, messageId } = payload
      
      if (!messageId) return
      if (!channelId && !conversationId) return

      // Validate message exists
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { id: true, channelId: true, conversationId: true }
      })
      if (!message) return

      // Make sure the message matches the channel/conversation
      if (channelId && message.channelId !== channelId) return
      if (conversationId && message.conversationId !== conversationId) return

      await prisma.messageReadState.upsert({
        where: channelId
          ? { userId_channelId: { userId, channelId } }
          : { userId_conversationId: { userId, conversationId: conversationId! } },
        update: { lastReadMessageId: messageId },
        create: {
          userId,
          channelId,
          conversationId,
          lastReadMessageId: messageId
        }
      })

      // Asynchronously clear notifications for this room
      import('../services/notification.service.js')
        .then(ns => ns.markRoomAsRead(userId, channelId, conversationId))
        .catch(err => console.error('Failed to clear room notifications', err))

      // We can broadcast to the user's personal room to update multiple tabs
      io.to(`user:${userId}`).emit('message:read', {
        channelId,
        conversationId,
        messageId
      })
    } catch (err) {
      console.error('Error updating read state:', err)
    }
  })
}
