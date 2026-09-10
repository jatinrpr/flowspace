import { create } from 'zustand'
import type { WorkspaceInfo, WorkspaceDetail, WorkspaceMember, WorkspaceInvitation } from '../types/workspace'
import * as workspaceApi from '../services/workspace'
import { ApiError } from '../services/api'

interface WorkspaceState {
  workspaces: WorkspaceInfo[]
  currentWorkspace: WorkspaceDetail | null
  currentWorkspaceId: string | null
  members: WorkspaceMember[]
  invitations: WorkspaceInvitation[]
  isLoading: boolean
  error: string | null
  
  fetchWorkspaces: () => Promise<void>
  createWorkspace: (name: string) => Promise<WorkspaceInfo>
  selectWorkspace: (workspaceId: string) => Promise<void>
  updateWorkspace: (name: string) => Promise<void>
  deleteWorkspace: () => Promise<void>
  fetchMembers: () => Promise<void>
  removeMember: (userId: string) => Promise<void>
  inviteMember: (email: string) => Promise<{ id: string; email: string; expiresAt: string; inviteUrl: string }>
  fetchInvitations: () => Promise<void>
  revokeInvitation: (invitationId: string) => Promise<void>
  joinWorkspace: (token: string) => Promise<WorkspaceInfo>
  clearError: () => void
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  currentWorkspaceId: null,
  members: [],
  invitations: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null })
    try {
      const { workspaces } = await workspaceApi.getWorkspaces()
      set({ workspaces, isLoading: false })
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Failed to fetch workspaces', isLoading: false })
    }
  },

  createWorkspace: async (name: string) => {
    set({ isLoading: true, error: null })
    try {
      const { workspace } = await workspaceApi.createWorkspace(name)
      const currentWorkspaces = get().workspaces
      set({ workspaces: [...currentWorkspaces, workspace], isLoading: false })
      return workspace
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to create workspace'
      set({ error: errorMsg, isLoading: false })
      throw new Error(errorMsg)
    }
  },

  selectWorkspace: async (workspaceId: string) => {
    set({ isLoading: true, error: null })
    try {
      const { workspace } = await workspaceApi.getWorkspace(workspaceId)
      set({ currentWorkspace: workspace, currentWorkspaceId: workspaceId, isLoading: false })
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to load workspace'
      set({ error: errorMsg, currentWorkspace: null, currentWorkspaceId: null, isLoading: false })
      throw new Error(errorMsg)
    }
  },

  updateWorkspace: async (name: string) => {
    const { currentWorkspaceId } = get()
    if (!currentWorkspaceId) return
    set({ isLoading: true, error: null })
    try {
      await workspaceApi.updateWorkspace(currentWorkspaceId, name)
      await get().selectWorkspace(currentWorkspaceId)
      await get().fetchWorkspaces()
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to update workspace'
      set({ error: errorMsg, isLoading: false })
      throw new Error(errorMsg)
    }
  },

  deleteWorkspace: async () => {
    const { currentWorkspaceId } = get()
    if (!currentWorkspaceId) return
    set({ isLoading: true, error: null })
    try {
      await workspaceApi.deleteWorkspace(currentWorkspaceId)
      set({ currentWorkspace: null, currentWorkspaceId: null })
      await get().fetchWorkspaces()
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to delete workspace'
      set({ error: errorMsg, isLoading: false })
      throw new Error(errorMsg)
    }
  },

  fetchMembers: async () => {
    const { currentWorkspaceId } = get()
    if (!currentWorkspaceId) return
    set({ isLoading: true, error: null })
    try {
      const { members } = await workspaceApi.getWorkspaceMembers(currentWorkspaceId)
      set({ members, isLoading: false })
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Failed to fetch members', isLoading: false })
    }
  },

  removeMember: async (userId: string) => {
    const { currentWorkspaceId } = get()
    if (!currentWorkspaceId) return
    set({ isLoading: true, error: null })
    try {
      await workspaceApi.removeWorkspaceMember(currentWorkspaceId, userId)
      await get().fetchMembers()
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to remove member'
      set({ error: errorMsg, isLoading: false })
      throw new Error(errorMsg)
    }
  },

  inviteMember: async (email: string) => {
    const { currentWorkspaceId } = get()
    if (!currentWorkspaceId) throw new Error('No workspace selected')
    set({ isLoading: true, error: null })
    try {
      const { invitation } = await workspaceApi.inviteMember(currentWorkspaceId, email)
      set({ isLoading: false })
      return invitation
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to invite member'
      set({ error: errorMsg, isLoading: false })
      throw new Error(errorMsg)
    }
  },

  fetchInvitations: async () => {
    const { currentWorkspaceId } = get()
    if (!currentWorkspaceId) return
    set({ isLoading: true, error: null })
    try {
      const { invitations } = await workspaceApi.getInvitations(currentWorkspaceId)
      set({ invitations, isLoading: false })
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Failed to fetch invitations', isLoading: false })
    }
  },

  revokeInvitation: async (invitationId: string) => {
    const { currentWorkspaceId } = get()
    if (!currentWorkspaceId) return
    set({ isLoading: true, error: null })
    try {
      await workspaceApi.revokeInvitation(currentWorkspaceId, invitationId)
      await get().fetchInvitations()
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to revoke invitation'
      set({ error: errorMsg, isLoading: false })
      throw new Error(errorMsg)
    }
  },

  joinWorkspace: async (token: string) => {
    set({ isLoading: true, error: null })
    try {
      const { workspace } = await workspaceApi.joinWorkspace(token)
      await get().fetchWorkspaces()
      set({ isLoading: false })
      return workspace
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to join workspace'
      set({ error: errorMsg, isLoading: false })
      throw new Error(errorMsg)
    }
  }
}))
