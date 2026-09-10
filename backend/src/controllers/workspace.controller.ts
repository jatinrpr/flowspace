import type { RequestHandler } from 'express'
import * as workspaceService from '../services/workspace.service.js'
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  joinWorkspaceSchema,
} from '../validators/workspace.validator.js'

export const createWorkspace: RequestHandler = async (req, res) => {
  const input = createWorkspaceSchema.parse(req.body)
  const workspace = await workspaceService.createWorkspace(req.auth!.userId, input.name)
  res.status(201).json({ success: true, workspace })
}

export const listWorkspaces: RequestHandler = async (req, res) => {
  const workspaces = await workspaceService.getUserWorkspaces(req.auth!.userId)
  res.status(200).json({ success: true, workspaces })
}

export const getWorkspace: RequestHandler<{ workspaceId: string }> = async (req, res) => {
  const workspace = await workspaceService.getWorkspace(req.params.workspaceId, req.auth!.userId)
  res.status(200).json({ success: true, workspace })
}

export const updateWorkspace: RequestHandler<{ workspaceId: string }> = async (req, res) => {
  const input = updateWorkspaceSchema.parse(req.body)
  const workspace = await workspaceService.updateWorkspace(req.params.workspaceId, input.name!)
  res.status(200).json({ success: true, workspace })
}

export const deleteWorkspace: RequestHandler<{ workspaceId: string }> = async (req, res) => {
  await workspaceService.deleteWorkspace(req.params.workspaceId)
  res.status(200).json({ success: true, message: 'Workspace deleted successfully' })
}

export const listMembers: RequestHandler<{ workspaceId: string }> = async (req, res) => {
  const members = await workspaceService.getWorkspaceMembers(req.params.workspaceId)
  res.status(200).json({ success: true, members })
}

export const removeMember: RequestHandler<{ workspaceId: string, userId: string }> = async (req, res) => {
  await workspaceService.removeMember(
    req.params.workspaceId,
    req.params.userId,
    req.workspaceMember!.role,
    req.auth!.userId
  )
  res.status(200).json({ success: true, message: 'Member removed successfully' })
}

import { z } from 'zod'
import { WorkspaceRole, AuditLogAction } from '@prisma/client'
import * as auditService from '../services/audit.service.js'

const updateRoleSchema = z.object({
  role: z.nativeEnum(WorkspaceRole)
})

export const updateMemberRole: RequestHandler<{ workspaceId: string, userId: string }> = async (req, res) => {
  const { role } = updateRoleSchema.parse(req.body)
  const updated = await workspaceService.updateMemberRole(
    req.params.workspaceId,
    req.params.userId,
    role,
    req.workspaceMember!.role,
    req.auth!.userId
  )
  res.status(200).json({ success: true, member: updated })
}

export const getAdminOverview: RequestHandler<{ workspaceId: string }> = async (req, res) => {
  const overview = await workspaceService.getAdminOverview(req.params.workspaceId)
  res.status(200).json({ success: true, ...overview })
}

export const getAuditLogs: RequestHandler<{ workspaceId: string }> = async (req, res) => {
  const page = req.query.page ? parseInt(String(req.query.page), 10) : 1
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20
  const action = req.query.action ? (String(req.query.action) as AuditLogAction) : undefined
  const actorUserId = req.query.actorUserId ? String(req.query.actorUserId) : undefined

  const result = await auditService.getAuditLogs(req.params.workspaceId, { page, limit, action, actorUserId })
  res.status(200).json({ success: true, ...result })
}

export const inviteMember: RequestHandler<{ workspaceId: string }> = async (req, res) => {
  const input = inviteMemberSchema.parse(req.body)
  const invitation = await workspaceService.inviteMember(
    req.params.workspaceId,
    input.email,
    req.auth!.userId
  )
  res.status(201).json({ success: true, invitation })
}

export const listInvitations: RequestHandler<{ workspaceId: string }> = async (req, res) => {
  const invitations = await workspaceService.getInvitations(req.params.workspaceId)
  res.status(200).json({ success: true, invitations })
}

export const revokeInvitation: RequestHandler<{ workspaceId: string, invitationId: string }> = async (req, res) => {
  await workspaceService.revokeInvitation(req.params.workspaceId, req.params.invitationId)
  res.status(200).json({ success: true, message: 'Invitation revoked successfully' })
}

import * as authService from '../services/auth.service.js' // for email lookup

export const joinWorkspace: RequestHandler = async (req, res) => {
  const input = joinWorkspaceSchema.parse(req.body)
  
  const user = await authService.getCurrentUser(req.auth!.userId)
  
  const workspace = await workspaceService.joinWorkspace(
    req.auth!.userId,
    user.email,
    input.token
  )
  res.status(200).json({ success: true, workspace })
}

