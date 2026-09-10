import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/app-error.js'

export const normalizeChannelName = (name: string) => {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')
}

import { createAuditLog } from './audit.service.js'
import { AuditLogAction } from '@prisma/client'

export const createChannel = async (
  workspaceId: string,
  userId: string,
  name: string,
  isPrivate: boolean,
  description?: string
) => {
  const normalizedName = normalizeChannelName(name)
  if (!normalizedName) throw new AppError('Invalid channel name', 400)

  const existing = await prisma.channel.findUnique({
    where: { workspaceId_name: { workspaceId, name: normalizedName } },
  })
  if (existing) throw new AppError('Channel name already exists', 409)

  const channel = await prisma.$transaction(async (tx) => {
    const ch = await tx.channel.create({
      data: {
        workspaceId,
        name: normalizedName,
        description,
        isPrivate,
        createdById: userId,
      },
    })
    await tx.channelMember.create({
      data: {
        channelId: ch.id,
        userId,
      },
    })
    return ch
  })

  await createAuditLog({
    workspaceId,
    actorUserId: userId,
    action: AuditLogAction.CHANNEL_CREATED,
    targetType: 'Channel',
    targetId: channel.id,
    metadata: { name: channel.name, isPrivate }
  })

  return channel
}

export const listChannels = async (workspaceId: string, userId: string) => {
  // Public channels OR private channels where the user is a member
  return prisma.channel.findMany({
    where: {
      workspaceId,
      OR: [
        { isPrivate: false },
        { members: { some: { userId } } },
      ],
    },
    include: {
      _count: { select: { members: true } }
    },
    orderBy: { name: 'asc' }
  })
}

export const getChannel = async (channelId: string, userId: string) => {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: {
      members: { where: { userId } },
      _count: { select: { members: true } }
    },
  })

  if (!channel) throw new AppError('Channel not found', 404)

  if (channel.isPrivate && channel.members.length === 0) {
    throw new AppError('Forbidden', 403)
  }

  return channel
}

export const updateChannel = async (channelId: string, data: { name?: string; description?: string | null }, userId?: string) => {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } })
  if (!channel) throw new AppError('Channel not found', 404)

  const updateData: any = {}
  
  if (data.name) {
    const normalizedName = normalizeChannelName(data.name)
    if (!normalizedName) throw new AppError('Invalid channel name', 400)
    
    if (normalizedName !== channel.name) {
      const existing = await prisma.channel.findUnique({
        where: { workspaceId_name: { workspaceId: channel.workspaceId, name: normalizedName } },
      })
      if (existing) throw new AppError('Channel name already exists', 409)
      updateData.name = normalizedName
    }
  }

  if (data.description !== undefined) {
    updateData.description = data.description
  }

  if (Object.keys(updateData).length === 0) return channel

  const updated = await prisma.channel.update({
    where: { id: channelId },
    data: updateData,
  })

  await createAuditLog({
    workspaceId: channel.workspaceId,
    actorUserId: userId,
    action: AuditLogAction.CHANNEL_RENAMED,
    targetType: 'Channel',
    targetId: channelId,
    metadata: { oldName: channel.name, newName: updated.name }
  })

  return updated
}

export const deleteChannel = async (channelId: string, userId?: string) => {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } })
  if (!channel) throw new AppError('Channel not found', 404)
  if (channel.name === 'general') {
    throw new AppError('Cannot delete the #general channel', 400)
  }

  await prisma.channel.delete({ where: { id: channelId } })

  await createAuditLog({
    workspaceId: channel.workspaceId,
    actorUserId: userId,
    action: AuditLogAction.CHANNEL_DELETED,
    targetType: 'Channel',
    targetId: channelId,
    metadata: { channelName: channel.name }
  })
}

export const getChannelMembers = async (channelId: string) => {
  const members = await prisma.channelMember.findMany({
    where: { channelId },
    include: { user: true },
    orderBy: { user: { name: 'asc' } }
  })
  return members.map(m => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    avatarUrl: m.user.avatarUrl,
  }))
}

export const addChannelMember = async (channelId: string, targetUserId: string, requesterUserId: string) => {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } })
  if (!channel) throw new AppError('Channel not found', 404)

  // Verify target user is in workspace
  const targetMember = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId: channel.workspaceId } }
  })
  if (!targetMember) throw new AppError('User is not a workspace member', 400)

  // Verify requester is in channel if private
  if (channel.isPrivate) {
    const requesterMember = await prisma.channelMember.findUnique({
      where: { userId_channelId: { userId: requesterUserId, channelId } }
    })
    if (!requesterMember) throw new AppError('Forbidden', 403)
  }

  const existing = await prisma.channelMember.findUnique({
    where: { userId_channelId: { userId: targetUserId, channelId } }
  })
  if (existing) throw new AppError('User is already in channel', 409)

  await prisma.channelMember.create({
    data: { channelId, userId: targetUserId }
  })
}

export const removeChannelMember = async (channelId: string, targetUserId: string, requesterUserId: string) => {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } })
  if (!channel) throw new AppError('Channel not found', 404)

  const requesterMember = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: requesterUserId, workspaceId: channel.workspaceId } }
  })
  
  const requesterRole = requesterMember?.role || 'MEMBER'

  if (targetUserId !== requesterUserId) {
    if (requesterRole !== 'OWNER' && requesterRole !== 'ADMIN') {
      const isChannelMember = await prisma.channelMember.findUnique({
        where: { userId_channelId: { userId: requesterUserId, channelId } }
      })
      if (!isChannelMember || channel.createdById !== requesterUserId) {
        throw new AppError('Forbidden: Not authorized to remove users', 403)
      }
    }
  }

  const existing = await prisma.channelMember.findUnique({
    where: { userId_channelId: { userId: targetUserId, channelId } }
  })
  if (!existing) throw new AppError('User is not in channel', 404)

  await prisma.channelMember.delete({
    where: { id: existing.id }
  })
}
