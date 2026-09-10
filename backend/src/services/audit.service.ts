import { prisma } from '../lib/prisma.js'
import { AuditLogAction, Prisma } from '@prisma/client'

export interface CreateAuditLogOpts {
  workspaceId: string
  actorUserId?: string | null
  action: AuditLogAction
  targetType?: string
  targetId?: string
  metadata?: Prisma.InputJsonValue
  ipAddress?: string
  userAgent?: string
}

export const createAuditLog = async (opts: CreateAuditLogOpts) => {
  try {
    return await prisma.auditLog.create({
      data: {
        workspaceId: opts.workspaceId,
        actorUserId: opts.actorUserId ?? null,
        action: opts.action,
        targetType: opts.targetType ?? null,
        targetId: opts.targetId ?? null,
        metadata: opts.metadata ?? Prisma.DbNull,
        ipAddress: opts.ipAddress ?? null,
        userAgent: opts.userAgent ?? null,
      },
    })
  } catch (err) {
    console.error('[AuditLog] Error creating audit log:', err)
  }
}

export const getAuditLogs = async (
  workspaceId: string,
  opts?: { page?: number; limit?: number; action?: AuditLogAction; actorUserId?: string }
) => {
  const page = Math.max(1, opts?.page ?? 1)
  const limit = Math.min(100, Math.max(1, opts?.limit ?? 20))
  const skip = (page - 1) * limit

  const where: Prisma.AuditLogWhereInput = {
    workspaceId,
    ...(opts?.action ? { action: opts.action } : {}),
    ...(opts?.actorUserId ? { actorUserId: opts.actorUserId } : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  const actorUserIds = Array.from(new Set(logs.map(l => l.actorUserId).filter(Boolean))) as string[]
  const actors = await prisma.user.findMany({
    where: { id: { in: actorUserIds } },
    select: { id: true, name: true, email: true, avatarUrl: true },
  })

  const actorMap = new Map(actors.map(a => [a.id, a]))

  const formattedLogs = logs.map(l => ({
    ...l,
    actor: l.actorUserId ? actorMap.get(l.actorUserId) ?? null : null,
  }))

  return {
    logs: formattedLogs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}
