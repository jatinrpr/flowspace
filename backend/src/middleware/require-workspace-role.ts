import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/app-error.js'
import { WorkspaceRole } from '@prisma/client'
import { hasPermission, Permission } from '../config/permissions.js'

export const requireWorkspaceRole = (roles: WorkspaceRole[]) => {
  return async (request: Request, _response: Response, next: NextFunction) => {
    try {
      const userId = request.auth?.userId
      const workspaceId = request.params.workspaceId

      if (!userId) {
        throw new AppError('Authentication required', 401)
      }

      if (!workspaceId) {
        throw new AppError('Workspace ID is required', 400)
      }

      const membership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: String(workspaceId),
          },
        },
      })

      if (!membership) {
        throw new AppError('Forbidden: Not a member of this workspace', 403)
      }

      if (roles.length > 0 && !roles.includes(membership.role)) {
        throw new AppError('Forbidden: Insufficient permissions', 403)
      }

      request.workspaceMember = membership
      next()
    } catch (error) {
      next(error)
    }
  }
}

export const requireWorkspacePermission = (permission: Permission) => {
  return async (request: Request, _response: Response, next: NextFunction) => {
    try {
      const userId = request.auth?.userId
      const workspaceId = request.params.workspaceId

      if (!userId) {
        throw new AppError('Authentication required', 401)
      }

      if (!workspaceId) {
        throw new AppError('Workspace ID is required', 400)
      }

      const membership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: String(workspaceId),
          },
        },
      })

      if (!membership) {
        throw new AppError('Forbidden: Not a member of this workspace', 403)
      }

      if (!hasPermission(membership.role, permission)) {
        throw new AppError('Forbidden: Insufficient permissions', 403)
      }

      request.workspaceMember = membership
      next()
    } catch (error) {
      next(error)
    }
  }
}

