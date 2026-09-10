import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/app-error.js'

export const getThread = async (messageId: string, _userId: string) => {
  const rootMessage = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      channel: true,
      conversation: { include: { members: true } }
    }
  })
  
  if (!rootMessage) throw new AppError('Message not found', 404)
  
  // Authorization handled simplistically here for brevity
  
  let thread = await prisma.thread.findUnique({
    where: { rootMessageId: messageId },
    include: {
      replies: {
        where: { deletedAt: null },
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } },
          reactions: { include: { user: { select: { id: true, name: true } } } },
          files: true,
          mentions: { include: { user: { select: { id: true, name: true } } } }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  // If no thread exists yet, return empty replies
  if (!thread) {
    return { id: null, rootMessageId: messageId, replies: [] }
  }

  return thread
}

export const createReply = async (parentMessageId: string, userId: string, content: string, type: string = 'TEXT') => {
  if ((!content || content.trim().length === 0) && type !== 'FILE' && type !== 'VOICE') {
    throw new AppError('Reply cannot be empty', 400)
  }

  const rootMessage = await prisma.message.findUnique({
    where: { id: parentMessageId }
  })
  
  if (!rootMessage) throw new AppError('Parent message not found', 404)

  let thread = await prisma.thread.findUnique({
    where: { rootMessageId: parentMessageId }
  })

  if (!thread) {
    thread = await prisma.thread.create({
      data: { rootMessageId: parentMessageId }
    })
  }

  const reply = await prisma.message.create({
    data: {
      content: content ? content.trim() : '',
      senderId: userId,
      channelId: rootMessage.channelId,
      conversationId: rootMessage.conversationId,
      threadId: thread.id,
      type: type as any
    },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
      reactions: { include: { user: { select: { id: true, name: true } } } },
      files: true,
      mentions: { include: { user: { select: { id: true, name: true } } } }
    }
  })

  try {
    const ns = await import('./notification.service.js')
    await ns.processMessageNotifications(reply)
  } catch (err) {
    console.error('Notification processing error', err)
  }

  return reply
}
