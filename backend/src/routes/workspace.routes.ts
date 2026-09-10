import { Router } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { requireWorkspaceRole } from '../middleware/require-workspace-role.js'
import * as workspaceController from '../controllers/workspace.controller.js'
import { searchRouter } from './search.routes.js'

export const workspaceRouter = Router()

// All routes require authentication
workspaceRouter.use(requireAuth)

// Mount search
workspaceRouter.use('/:workspaceId/search', searchRouter)

import { requireWorkspacePermission } from '../middleware/require-workspace-role.js'
import { sensitiveActionLimiter } from '../middleware/security.js'

// Join workspace via token
workspaceRouter.post('/join', sensitiveActionLimiter, workspaceController.joinWorkspace)

// Workspaces CRUD
workspaceRouter.post('/', sensitiveActionLimiter, workspaceController.createWorkspace)
workspaceRouter.get('/', workspaceController.listWorkspaces)
workspaceRouter.get('/:workspaceId', requireWorkspaceRole([]), workspaceController.getWorkspace)
workspaceRouter.patch('/:workspaceId', requireWorkspacePermission('MANAGE_WORKSPACE'), workspaceController.updateWorkspace)
workspaceRouter.delete('/:workspaceId', requireWorkspacePermission('DELETE_WORKSPACE'), workspaceController.deleteWorkspace)

// Workspace Admin Overview & Audit Logs
workspaceRouter.get('/:workspaceId/admin/overview', requireWorkspacePermission('VIEW_AUDIT_LOGS'), workspaceController.getAdminOverview)
workspaceRouter.get('/:workspaceId/audit-logs', requireWorkspacePermission('VIEW_AUDIT_LOGS'), workspaceController.getAuditLogs)

// Workspace Members
workspaceRouter.get('/:workspaceId/members', requireWorkspaceRole([]), workspaceController.listMembers)
workspaceRouter.patch('/:workspaceId/members/:userId/role', requireWorkspacePermission('MANAGE_ROLES'), workspaceController.updateMemberRole)
workspaceRouter.delete('/:workspaceId/members/:userId', requireWorkspacePermission('MANAGE_MEMBERS'), workspaceController.removeMember)

// Workspace Invitations
workspaceRouter.post('/:workspaceId/invitations', sensitiveActionLimiter, requireWorkspacePermission('MANAGE_INVITATIONS'), workspaceController.inviteMember)
workspaceRouter.get('/:workspaceId/invitations', requireWorkspacePermission('MANAGE_INVITATIONS'), workspaceController.listInvitations)
workspaceRouter.delete('/:workspaceId/invitations/:invitationId', requireWorkspacePermission('MANAGE_INVITATIONS'), workspaceController.revokeInvitation)

import * as channelController from '../controllers/channel.controller.js'

// Workspace Channels
workspaceRouter.post('/:workspaceId/channels', requireWorkspaceRole([]), channelController.createChannel)
workspaceRouter.get('/:workspaceId/channels', requireWorkspaceRole([]), channelController.listChannels)

import * as conversationController from '../controllers/conversation.controller.js'

// Workspace Conversations (DMs)
workspaceRouter.post('/:workspaceId/conversations', requireWorkspaceRole([]), conversationController.createConversation)
workspaceRouter.get('/:workspaceId/conversations', requireWorkspaceRole([]), conversationController.listConversations)



