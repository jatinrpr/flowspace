import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/app-error.js'

export const addReaction = async (messageId: string, userId: string, emoji: string) => {
  if (!emoji || emoji.trim().length === 0) {
    throw new AppError('Emoji cannot be empty', 400)
  }

  const message = await prisma.message.findUnique({
    where: { id: messageId },
  })
  
  if (!message) throw new AppError('Message not found', 404)
  
  const reaction = await prisma.reaction.upsert({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId,
        emoji
      }
    },
    update: {},
    create: {
      messageId,
      userId,
      emoji
    },
    include: {
      user: {
        select: { id: true, name: true }
      }
    }
  })

  return reaction
}

export const removeReaction = async (messageId: string, userId: string, emoji: string) => {
  const existing = await prisma.reaction.findUnique({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId,
        emoji
      }
    }
  })

  if (!existing) return null

  await prisma.reaction.delete({
    where: { id: existing.id }
  })

  return existing
}
