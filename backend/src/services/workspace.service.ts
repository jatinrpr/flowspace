import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/app-error.js'
import { WorkspaceRole } from '@prisma/client'
import { createOpaqueToken, hashToken } from '../utils/token.js'
import { env, isProduction } from '../config/env.js'
import { durationToMilliseconds } from '../utils/duration.js'

const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6)
}

export const createWorkspace = async (userId: string, name: string) => {
  const slug = generateSlug(name)

  const result = await prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: { name, slug },
    })

    await tx.workspaceMember.create({
      data: {
        userId,
        workspaceId: workspace.id,
        role: WorkspaceRole.OWNER,
      },
    })

    const general = await tx.channel.create({
      data: {
        workspaceId: workspace.id,
        name: 'general',
        description: 'General discussion',
        createdById: userId,
      }
    })
    
    await tx.channelMember.create({
      data: { channelId: general.id, userId }
    })

    const random = await tx.channel.create({
      data: {
        workspaceId: workspace.id,
        name: 'random',
        description: 'Non-work banter and water cooler conversation',
        createdById: userId,
      }
    })
    
    await tx.channelMember.create({
      data: { channelId: random.id, userId }
    })

    return workspace
  })

  return {
    id: result.id,
    name: result.name,
    slug: result.slug,
    role: WorkspaceRole.OWNER,
  }
}

export const getUserWorkspaces = async (userId: string) => {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: { workspace: true },
    orderBy: { createdAt: 'asc' },
  })

  return memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
    role: m.role,
  }))
}

export const getWorkspace = async (workspaceId: string, userId: string) => {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    include: { workspace: true },
  })

  if (!membership) throw new AppError('Workspace not found', 404)

  const memberCount = await prisma.workspaceMember.count({
    where: { workspaceId },
  })

  return {
    id: membership.workspace.id,
    name: membership.workspace.name,
    slug: membership.workspace.slug,
    role: membership.role,
    createdAt: membership.workspace.createdAt,
    memberCount,
  }
}

export const updateWorkspace = async (workspaceId: string, name: string) => {
  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { name },
  })
  return workspace
}

export const deleteWorkspace = async (workspaceId: string) => {
  await prisma.workspace.delete({ where: { id: workspaceId } })
}

export const getWorkspaceMembers = async (workspaceId: string) => {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: true },
  })

  return members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    avatarUrl: m.user.avatarUrl,
    role: m.role,
    status: m.user.status,
  }))
}

import { createAuditLog } from './audit.service.js'
import { AuditLogAction } from '@prisma/client'

export const updateMemberRole = async (
  workspaceId: string,
  targetUserId: string,
  newRole: WorkspaceRole,
  requesterRole: WorkspaceRole,
  requesterUserId: string
) => {
  if (requesterUserId === targetUserId && newRole !== WorkspaceRole.OWNER) {
    throw new AppError('Cannot change your own role directly', 400)
  }

  const targetMember = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
    include: { user: true }
  })

  if (!targetMember) throw new AppError('Member not found', 404)

  const oldRole = targetMember.role

  if (oldRole === newRole) return targetMember

  // Strict role permissions & ownership transfer rules
  if (newRole === WorkspaceRole.OWNER) {
    if (requesterRole !== WorkspaceRole.OWNER) {
      throw new AppError('Only the workspace owner can transfer ownership', 403)
    }

    // Ownership transfer transaction: promote target to OWNER, demote requester to ADMIN
    await prisma.$transaction(async (tx) => {
      await tx.workspaceMember.update({
        where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
        data: { role: WorkspaceRole.OWNER }
      })

      await tx.workspaceMember.update({
        where: { userId_workspaceId: { userId: requesterUserId, workspaceId } },
        data: { role: WorkspaceRole.ADMIN }
      })
    })

    await createAuditLog({
      workspaceId,
      actorUserId: requesterUserId,
      action: AuditLogAction.USER_ROLE_CHANGED,
      targetType: 'User',
      targetId: targetUserId,
      metadata: { action: 'ownership_transfer', oldOwnerId: requesterUserId, newOwnerId: targetUserId }
    })

    return { ...targetMember, role: WorkspaceRole.OWNER }
  }

  // Only OWNER can promote/demote ADMINs
  if (oldRole === WorkspaceRole.ADMIN || newRole === WorkspaceRole.ADMIN) {
    if (requesterRole !== WorkspaceRole.OWNER) {
      throw new AppError('Only the workspace owner can assign or remove admin roles', 403)
    }
  }

  // Admins cannot change roles of other Admins or Owner
  if (requesterRole === WorkspaceRole.ADMIN && (oldRole === WorkspaceRole.ADMIN || oldRole === WorkspaceRole.OWNER)) {
    throw new AppError('Admins cannot change roles of other admins or owner', 403)
  }

  const updated = await prisma.workspaceMember.update({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
    data: { role: newRole }
  })

  await createAuditLog({
    workspaceId,
    actorUserId: requesterUserId,
    action: AuditLogAction.USER_ROLE_CHANGED,
    targetType: 'User',
    targetId: targetUserId,
    metadata: { oldRole, newRole, targetName: targetMember.user.name }
  })

  return updated
}

export const getAdminOverview = async (workspaceId: string) => {
  const [totalMembers, totalChannels, pendingInvitations, recentAuditLogs] = await Promise.all([
    prisma.workspaceMember.count({ where: { workspaceId } }),
    prisma.channel.count({ where: { workspaceId } }),
    prisma.invitation.count({ where: { workspaceId, acceptedAt: null, expiresAt: { gt: new Date() } } }),
    prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ])

  const actorUserIds = Array.from(new Set(recentAuditLogs.map(l => l.actorUserId).filter(Boolean))) as string[]
  const actors = await prisma.user.findMany({
    where: { id: { in: actorUserIds } },
    select: { id: true, name: true, email: true, avatarUrl: true }
  })
  const actorMap = new Map(actors.map(a => [a.id, a]))

  const formattedLogs = recentAuditLogs.map(l => ({
    ...l,
    actor: l.actorUserId ? actorMap.get(l.actorUserId) ?? null : null
  }))

  return {
    totalMembers,
    totalChannels,
    pendingInvitations,
    recentAuditLogs: formattedLogs
  }
}

export const removeMember = async (workspaceId: string, targetUserId: string, requesterRole: WorkspaceRole, requesterUserId: string) => {
  if (requesterUserId === targetUserId) {
    throw new AppError('Cannot remove yourself through this endpoint', 400)
  }

  const targetMember = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
    include: { user: true }
  })

  if (!targetMember) throw new AppError('Member not found', 404)

  if (targetMember.role === WorkspaceRole.OWNER) {
    throw new AppError('Cannot remove the workspace owner', 403)
  }

  if (requesterRole === WorkspaceRole.ADMIN && targetMember.role === WorkspaceRole.ADMIN) {
    throw new AppError('Admins cannot remove other admins', 403)
  }

  await prisma.workspaceMember.delete({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } }
  })

  await createAuditLog({
    workspaceId,
    actorUserId: requesterUserId,
    action: AuditLogAction.USER_REMOVED,
    targetType: 'User',
    targetId: targetUserId,
    metadata: { removedUserName: targetMember.user.name, removedUserEmail: targetMember.user.email }
  })
}

export const inviteMember = async (workspaceId: string, email: string, invitedById: string) => {
  const existingMember = await prisma.workspaceMember.findFirst({
    where: { workspaceId, user: { email } },
  })
  if (existingMember) throw new AppError('User is already a member', 409)

  const rawToken = createOpaqueToken()
  const expiresAt = new Date(Date.now() + durationToMilliseconds('7d'))

  await prisma.invitation.deleteMany({
    where: { workspaceId, email, acceptedAt: null },
  })

  const invitation = await prisma.invitation.create({
    data: {
      workspaceId,
      email,
      tokenHash: hashToken(rawToken),
      expiresAt,
      invitedById,
    },
  })

  const inviteUrl = `${env.frontendUrl}/invite/${rawToken}`
  
  if (!isProduction) {
    console.info(`Invitation URL for ${email} in workspace ${workspaceId}: ${inviteUrl}`)
  }

  return {
    id: invitation.id,
    email: invitation.email,
    expiresAt: invitation.expiresAt,
    inviteUrl,
  }
}

export const getInvitations = async (workspaceId: string) => {
  const invites = await prisma.invitation.findMany({
    where: { workspaceId, acceptedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, email: true, expiresAt: true, createdAt: true },
  })
  return invites
}

export const revokeInvitation = async (workspaceId: string, invitationId: string) => {
  await prisma.invitation.deleteMany({
    where: { id: invitationId, workspaceId }
  })
}

export const joinWorkspace = async (userId: string, userEmail: string, token: string) => {
  const tokenHash = hashToken(token)

  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash }
  })

  if (!invitation) throw new AppError('Invalid invitation', 400)
  if (invitation.expiresAt < new Date()) throw new AppError('Invitation expired', 400)
  if (invitation.acceptedAt) throw new AppError('Invitation already accepted', 400)
  if (invitation.email !== userEmail) throw new AppError('Invitation is for a different email address', 400)

  const existingMember = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: invitation.workspaceId } }
  })
  if (existingMember) throw new AppError('You are already a member', 409)

  const result = await prisma.$transaction(async (tx) => {
    const member = await tx.workspaceMember.create({
      data: {
        userId,
        workspaceId: invitation.workspaceId,
        role: WorkspaceRole.MEMBER,
      }
    })

    await tx.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() }
    })

    const workspace = await tx.workspace.findUnique({
      where: { id: invitation.workspaceId }
    })

    return { member, workspace }
  })

  return {
    id: result.workspace!.id,
    name: result.workspace!.name,
    slug: result.workspace!.slug,
    role: result.member.role,
  }
}
