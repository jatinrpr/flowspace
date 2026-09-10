import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/app-error.js'
import { MessageType } from '@prisma/client'

export const authorizeChannelMessageAccess = async (channelId: string, userId: string) => {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: { members: true, workspace: { include: { members: true } } }
  })
  if (!channel) throw new AppError('Channel not found', 404)
  
  if (channel.isPrivate) {
    const isMember = channel.members.some(m => m.userId === userId)
    if (!isMember) throw new AppError('Forbidden', 403)
  } else {
    const isWorkspaceMember = channel.workspace.members.some(m => m.userId === userId)
    if (!isWorkspaceMember) throw new AppError('Forbidden', 403)
  }
}

export const authorizeConversationMessageAccess = async (conversationId: string, userId: string) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { members: true }
  })
  if (!conversation) throw new AppError('Conversation not found', 404)
  
  const isMember = conversation.members.some(m => m.userId === userId)
  if (!isMember) throw new AppError('Forbidden', 403)
}

export const createMessage = async ({
  channelId,
  conversationId,
  senderId,
  content,
  type = 'TEXT',
  clientMessageId,
  mentionedUserIds = []
}: {
  channelId?: string
  conversationId?: string
  senderId: string
  content: string
  type?: MessageType
  clientMessageId?: string
  mentionedUserIds?: string[]
}) => {
  if ((!content || content.trim().length === 0) && type !== 'FILE' && type !== 'VOICE') {
    throw new AppError('Message content cannot be empty', 400)
  }
  
  if (channelId && conversationId) {
    throw new AppError('Message cannot belong to both channel and conversation', 400)
  }
  if (!channelId && !conversationId) {
    throw new AppError('Message must belong to either channel or conversation', 400)
  }
  
  if (channelId) await authorizeChannelMessageAccess(channelId, senderId)
  if (conversationId) await authorizeConversationMessageAccess(conversationId, senderId)
  
  const message = await prisma.message.create({
    data: {
      channelId,
      conversationId,
      senderId,
      content: content ? content.trim() : '',
      type,
      clientMessageId,
      mentions: {
        create: mentionedUserIds.map(id => ({ mentionedUserId: id }))
      }
    },
    include: {
      sender: {
        select: { id: true, name: true, avatarUrl: true, email: true }
      },
      reactions: { include: { user: { select: { id: true, name: true } } } },
      files: true,
      mentions: { include: { user: { select: { id: true, name: true } } } },
      thread: { include: { _count: { select: { replies: true } } } }
    }
  })
  
  // Process notifications synchronously before returning to prevent read-receipt race conditions
  try {
    const ns = await import('./notification.service.js')
    await ns.processMessageNotifications(message)
  } catch (err) {
    console.error('Notification processing error', err)
  }
  
  return message
}

export const getMessages = async ({
  channelId,
  conversationId,
  userId,
  cursor,
  limit = 50
}: {
  channelId?: string
  conversationId?: string
  userId: string
  cursor?: string
  limit?: number
}) => {
  if (channelId) await authorizeChannelMessageAccess(channelId, userId)
  if (conversationId) await authorizeConversationMessageAccess(conversationId, userId)
  
  const messages = await prisma.message.findMany({
    where: {
      channelId: channelId || undefined,
      conversationId: conversationId || undefined
    },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      sender: {
        select: { id: true, name: true, avatarUrl: true, email: true }
      },
      reactions: { include: { user: { select: { id: true, name: true } } } },
      files: true,
      mentions: { include: { user: { select: { id: true, name: true } } } },
      thread: { include: { _count: { select: { replies: true } } } }
    }
  })
  
  let nextCursor: string | undefined = undefined
  if (messages.length > limit) {
    const nextItem = messages.pop()
    nextCursor = nextItem?.id
  }
  
  // Return in chronological order (oldest first)
  return {
    messages: messages.reverse(),
    nextCursor
  }
}

export const updateMessage = async (messageId: string, userId: string, content: string) => {
  const existing = await prisma.message.findUnique({ where: { id: messageId } })
  if (!existing) throw new AppError('Message not found', 404)
  if (existing.senderId !== userId) throw new AppError('Forbidden', 403)
  
  if ((!content || content.trim().length === 0) && existing.type !== 'FILE' && existing.type !== 'VOICE') {
    throw new AppError('Message content cannot be empty', 400)
  }

  const message = await prisma.message.update({
    where: { id: messageId },
    data: { content: content ? content.trim() : '' },
    include: {
      sender: {
        select: { id: true, name: true, avatarUrl: true, email: true }
      }
    }
  })
  return message
}

export const deleteMessage = async (messageId: string, userId: string) => {
  const existing = await prisma.message.findUnique({ where: { id: messageId } })
  if (!existing) throw new AppError('Message not found', 404)
  if (existing.senderId !== userId) throw new AppError('Forbidden', 403)
  
  const message = await prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date() },
    include: {
      sender: {
        select: { id: true, name: true, avatarUrl: true, email: true }
      }
    }
  })
  return message
}
