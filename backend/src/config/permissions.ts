import { WorkspaceRole } from '@prisma/client'

export type Permission =
  | 'MANAGE_WORKSPACE'
  | 'MANAGE_MEMBERS'
  | 'MANAGE_ROLES'
  | 'MANAGE_CHANNELS'
  | 'MANAGE_INVITATIONS'
  | 'MANAGE_FILES'
  | 'MODERATE_MESSAGES'
  | 'VIEW_AUDIT_LOGS'
  | 'MANAGE_SECURITY'
  | 'DELETE_WORKSPACE'

export const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  [WorkspaceRole.OWNER]: [
    'MANAGE_WORKSPACE',
    'MANAGE_MEMBERS',
    'MANAGE_ROLES',
    'MANAGE_CHANNELS',
    'MANAGE_INVITATIONS',
    'MANAGE_FILES',
    'MODERATE_MESSAGES',
    'VIEW_AUDIT_LOGS',
    'MANAGE_SECURITY',
    'DELETE_WORKSPACE',
  ],
  [WorkspaceRole.ADMIN]: [
    'MANAGE_WORKSPACE',
    'MANAGE_MEMBERS',
    'MANAGE_CHANNELS',
    'MANAGE_INVITATIONS',
    'MANAGE_FILES',
    'MODERATE_MESSAGES',
    'VIEW_AUDIT_LOGS',
    'MANAGE_SECURITY',
  ],
  [WorkspaceRole.MEMBER]: [],
}

export function hasPermission(role: WorkspaceRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}
