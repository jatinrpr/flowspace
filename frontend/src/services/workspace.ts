import { apiRequest } from './api'
import type {
  WorkspaceInfo,
  WorkspaceDetail,
  WorkspaceMember,
  WorkspaceInvitation,
} from '../types/workspace'

export const createWorkspace = async (name: string) => {
  return apiRequest<{ success: boolean; workspace: WorkspaceInfo }>('/workspaces', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export const getWorkspaces = async () => {
  return apiRequest<{ success: boolean; workspaces: WorkspaceInfo[] }>('/workspaces')
}

export const getWorkspace = async (workspaceId: string) => {
  return apiRequest<{ success: boolean; workspace: WorkspaceDetail }>(`/workspaces/${workspaceId}`)
}

export const updateWorkspace = async (workspaceId: string, name: string) => {
  return apiRequest<{ success: boolean; workspace: WorkspaceInfo }>(`/workspaces/${workspaceId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}

export const deleteWorkspace = async (workspaceId: string) => {
  return apiRequest<{ success: boolean; message: string }>(`/workspaces/${workspaceId}`, {
    method: 'DELETE',
  })
}

export const getWorkspaceMembers = async (workspaceId: string) => {
  return apiRequest<{ success: boolean; members: WorkspaceMember[] }>(`/workspaces/${workspaceId}/members`)
}

export const removeWorkspaceMember = async (workspaceId: string, userId: string) => {
  return apiRequest<{ success: boolean; message: string }>(`/workspaces/${workspaceId}/members/${userId}`, {
    method: 'DELETE',
  })
}

export const inviteMember = async (workspaceId: string, email: string) => {
  return apiRequest<{ success: boolean; invitation: { id: string; email: string; expiresAt: string; inviteUrl: string } }>(`/workspaces/${workspaceId}/invitations`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export const getInvitations = async (workspaceId: string) => {
  return apiRequest<{ success: boolean; invitations: WorkspaceInvitation[] }>(`/workspaces/${workspaceId}/invitations`)
}

export const revokeInvitation = async (workspaceId: string, invitationId: string) => {
  return apiRequest<{ success: boolean; message: string }>(`/workspaces/${workspaceId}/invitations/${invitationId}`, {
    method: 'DELETE',
  })
}

export const joinWorkspace = async (token: string) => {
  return apiRequest<{ success: boolean; workspace: WorkspaceInfo }>('/workspaces/join', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}
