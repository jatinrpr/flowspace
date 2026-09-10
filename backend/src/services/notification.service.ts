import { prisma } from '../lib/prisma.js'
import { NotificationType } from '@prisma/client'
import { io } from '../sockets/index.js'
import { pubClient } from '../lib/redis.js'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  message: string
  messageId?: string
  workspaceId?: string
  channelId?: string
  conversationId?: string
}

export const createNotification = async (params: CreateNotificationParams) => {
  const notification = await prisma.notification.create({
    data: params,
  })

  const isRedisReady = pubClient.status === 'ready'
  let unreadCount = 0
  if (isRedisReady) {
    unreadCount = await pubClient.incr('unread:notifications:' + params.userId)
  } else {
    unreadCount = await prisma.notification.count({ where: { userId: params.userId, read: false } })
  }

  if (io) {
    io.to('user:' + params.userId).emit('notification:new', {
      ...notification,
      unreadCount
    })
  }

  return notification
}

export const getUnreadCount = async (userId: string) => {
  const isRedisReady = pubClient.status === 'ready'
  if (isRedisReady) {
    const val = await pubClient.get('unread:notifications:' + userId)
    if (val !== null) return parseInt(val, 10)
  }
  
  const count = await prisma.notification.count({ where: { userId, read: false } })
  if (isRedisReady) {
    await pubClient.set('unread:notifications:' + userId, count.toString())
  }
  return count
}

export const getNotifications = async (userId: string, limit: number = 20, cursor?: string) => {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' }
  })

  let nextCursor: string | null = null
  let hasMore = false

  if (notifications.length > limit) {
    hasMore = true
    nextCursor = notifications[limit]?.id || null
    notifications.pop()
  }

  return { results: notifications, nextCursor, hasMore }
}

export const markAsRead = async (userId: string, notificationId: string) => {
  const notif = await prisma.notification.findUnique({ where: { id: notificationId } })
  if (!notif || notif.userId !== userId) throw new Error('Not found')
  if (notif.read) return notif

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true }
  })

  const isRedisReady = pubClient.status === 'ready'
  if (isRedisReady) {
    await pubClient.decr('unread:notifications:' + userId)
  }

  return updated
}

export const markAllAsRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true }
  })

  const isRedisReady = pubClient.status === 'ready'
  if (isRedisReady) {
    await pubClient.set('unread:notifications:' + userId, '0')
  }
}

export const markRoomAsRead = async (userId: string, channelId?: string, conversationId?: string) => {
  if (!channelId && !conversationId) return

  const updated = await prisma.notification.updateMany({
    where: { 
      userId, 
      read: false,
      channelId: channelId || undefined,
      conversationId: conversationId || undefined
    },
    data: { read: true }
  })

  if (updated.count > 0) {
    const count = await prisma.notification.count({ where: { userId, read: false } })
    
    const isRedisReady = pubClient.status === 'ready'
    if (isRedisReady) {
      await pubClient.set('unread:notifications:' + userId, count.toString())
    }
    
    // Emit socket event so frontend knows to update count
    if (io) {
      io.to('user:' + userId).emit('notification:room_read', { channelId, conversationId, unreadCount: count })
    }
  }
}

export const processMessageNotifications = async (message: any) => {
  const channel = message.channelId ? await prisma.channel.findUnique({ where: { id: message.channelId } }) : null
  const conversation = message.conversationId ? await prisma.conversation.findUnique({ where: { id: message.conversationId }, include: { members: true } }) : null

  const workspaceId = channel?.workspaceId || conversation?.workspaceId

  for (const mention of message.mentions || []) {
    if (mention.mentionedUserId === message.senderId) continue
    const exists = await prisma.notification.findFirst({
      where: { userId: mention.mentionedUserId, type: 'MENTION', messageId: message.id }
    })
    if (!exists) {
      await createNotification({
        userId: mention.mentionedUserId,
        type: 'MENTION',
        message: 'mentioned you',
        messageId: message.id,
        channelId: message.channelId,
        conversationId: message.conversationId,
        workspaceId
      })
    }
  }

  if (conversation) {
    for (const member of conversation.members) {
      if (member.userId === message.senderId) continue
      const exists = await prisma.notification.findFirst({
        where: { userId: member.userId, type: 'DM', messageId: message.id }
      })
      if (!exists) {
        await createNotification({
          userId: member.userId,
          type: 'DM',
          message: 'sent you a message',
          messageId: message.id,
          conversationId: message.conversationId,
          workspaceId
        })
      }
    }
  }

  if (message.threadId) {
    const thread = await prisma.thread.findUnique({
      where: { id: message.threadId },
      include: { rootMessage: true }
    })
    
    if (thread) {
      const participants = await prisma.message.findMany({
        where: { threadId: message.threadId },
        select: { senderId: true },
        distinct: ['senderId']
      })
      
      const userIdsToNotify = new Set<string>()
      if (thread.rootMessage.senderId !== message.senderId) {
        userIdsToNotify.add(thread.rootMessage.senderId)
      }
      for (const p of participants) {
        if (p.senderId !== message.senderId) userIdsToNotify.add(p.senderId)
      }
      
      for (const userId of userIdsToNotify) {
        const alreadyGotMention = message.mentions?.some((m: any) => m.mentionedUserId === userId)
        if (alreadyGotMention) continue

        const exists = await prisma.notification.findFirst({
          where: { userId, type: 'THREAD', messageId: message.id }
        })
        
        if (!exists) {
          await createNotification({
            userId,
            type: 'THREAD',
            message: 'replied to a thread you follow',
            messageId: message.id,
            channelId: message.channelId,
            conversationId: message.conversationId,
            workspaceId
          })
        }
      }
    }
  }
}
