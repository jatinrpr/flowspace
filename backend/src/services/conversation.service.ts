import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/app-error.js'

export const createConversation = async (
  workspaceId: string,
  userId: string,
  type: 'DIRECT' | 'GROUP',
  memberIds: string[],
  name?: string
) => {
  // Ensure the creator is in the members list
  const uniqueMembers = Array.from(new Set([...memberIds, userId]))

  if (type === 'DIRECT' && uniqueMembers.length !== 2) {
    throw new AppError('Direct messages must have exactly 2 unique members', 400)
  }

  if (type === 'GROUP' && uniqueMembers.length < 3) {
    throw new AppError('Group messages must have at least 3 members', 400)
  }

  // Verify all users are in the workspace
  const workspaceMembers = await prisma.workspaceMember.findMany({
    where: { workspaceId, userId: { in: uniqueMembers } }
  })
  if (workspaceMembers.length !== uniqueMembers.length) {
    throw new AppError('One or more users are not members of the workspace', 400)
  }

  if (type === 'DIRECT') {
    // Check if direct message already exists between these 2 users in this workspace
    const targetUserId = uniqueMembers.find(id => id !== userId)!
    
    // Find a DIRECT conversation in this workspace that has BOTH users
    const existing = await prisma.conversation.findFirst({
      where: {
        workspaceId,
        type: 'DIRECT',
        AND: [
          { members: { some: { userId: userId } } },
          { members: { some: { userId: targetUserId } } }
        ]
      }
    })

    if (existing) {
      return existing
    }
  }

  const conversation = await prisma.$transaction(async (tx) => {
    const conv = await tx.conversation.create({
      data: {
        workspaceId,
        type,
        name: type === 'GROUP' ? name : null,
        createdById: userId,
      }
    })

    await tx.conversationMember.createMany({
      data: uniqueMembers.map(id => ({
        conversationId: conv.id,
        userId: id
      }))
    })

    return conv
  })

  return conversation
}

export const listConversations = async (workspaceId: string, userId: string) => {
  return prisma.conversation.findMany({
    where: {
      workspaceId,
      members: { some: { userId } }
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, avatarUrl: true, email: true } } }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })
}

export const getConversation = async (conversationId: string, userId: string) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, avatarUrl: true, email: true } } }
      }
    }
  })

  if (!conversation) throw new AppError('Conversation not found', 404)

  const isMember = conversation.members.some(m => m.userId === userId)
  if (!isMember) throw new AppError('Forbidden', 403)

  return conversation
}

export const deleteConversation = async (conversationId: string, userId: string) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId }
  })
  if (!conversation) throw new AppError('Conversation not found', 404)
  if (conversation.createdById !== userId) throw new AppError('Forbidden: Only creator can delete', 403)

  await prisma.conversation.delete({ where: { id: conversationId } })
}

export const addConversationMember = async (conversationId: string, targetUserId: string, requesterUserId: string) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { members: true }
  })
  
  if (!conversation) throw new AppError('Conversation not found', 404)
  if (conversation.type === 'DIRECT') throw new AppError('Cannot add members to a DIRECT message', 400)
  
  const isRequesterMember = conversation.members.some(m => m.userId === requesterUserId)
  if (!isRequesterMember) throw new AppError('Forbidden', 403)

  const targetWorkspaceMember = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId: conversation.workspaceId } }
  })
  if (!targetWorkspaceMember) throw new AppError('Target user is not in the workspace', 400)

  const existing = conversation.members.some(m => m.userId === targetUserId)
  if (existing) throw new AppError('User is already in conversation', 409)

  await prisma.conversationMember.create({
    data: { conversationId, userId: targetUserId }
  })
}

export const removeConversationMember = async (conversationId: string, targetUserId: string, requesterUserId: string) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { members: true }
  })
  
  if (!conversation) throw new AppError('Conversation not found', 404)
  if (conversation.type === 'DIRECT') throw new AppError('Cannot remove members from a DIRECT message', 400)
  
  // Can remove yourself, or if you are the creator
  if (targetUserId !== requesterUserId && conversation.createdById !== requesterUserId) {
    throw new AppError('Forbidden: Not authorized to remove users', 403)
  }

  const existing = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { userId: targetUserId, conversationId } }
  })
  if (!existing) throw new AppError('User is not in conversation', 404)

  await prisma.conversationMember.delete({
    where: { id: existing.id }
  })
}
