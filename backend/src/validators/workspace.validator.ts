import { z } from 'zod'

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100, 'Workspace name is too long'),
})

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100, 'Workspace name is too long').optional(),
})

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const joinWorkspaceSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
})
