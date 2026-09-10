import { describe, it, expect } from 'vitest'
import { hasPermission, ROLE_PERMISSIONS } from '../../config/permissions.js'
import { WorkspaceRole } from '@prisma/client'

describe('Permission & Authorization Unit Tests', () => {
  it('OWNER should have all permissions', () => {
    const ownerPermissions = ROLE_PERMISSIONS[WorkspaceRole.OWNER]
    expect(ownerPermissions).toContain('MANAGE_WORKSPACE')
    expect(ownerPermissions).toContain('MANAGE_ROLES')
    expect(ownerPermissions).toContain('DELETE_WORKSPACE')
    expect(ownerPermissions).toContain('VIEW_AUDIT_LOGS')

    expect(hasPermission(WorkspaceRole.OWNER, 'MANAGE_WORKSPACE')).toBe(true)
    expect(hasPermission(WorkspaceRole.OWNER, 'DELETE_WORKSPACE')).toBe(true)
  })

  it('ADMIN should have administrative permissions except deleting workspace and managing roles', () => {
    expect(hasPermission(WorkspaceRole.ADMIN, 'MANAGE_WORKSPACE')).toBe(true)
    expect(hasPermission(WorkspaceRole.ADMIN, 'MANAGE_MEMBERS')).toBe(true)
    expect(hasPermission(WorkspaceRole.ADMIN, 'VIEW_AUDIT_LOGS')).toBe(true)
    expect(hasPermission(WorkspaceRole.ADMIN, 'MANAGE_ROLES')).toBe(false)
    expect(hasPermission(WorkspaceRole.ADMIN, 'DELETE_WORKSPACE')).toBe(false)
  })

  it('MEMBER should not have administrative or audit log permissions', () => {
    expect(hasPermission(WorkspaceRole.MEMBER, 'MANAGE_ROLES')).toBe(false)
    expect(hasPermission(WorkspaceRole.MEMBER, 'MANAGE_WORKSPACE')).toBe(false)
    expect(hasPermission(WorkspaceRole.MEMBER, 'DELETE_WORKSPACE')).toBe(false)
    expect(hasPermission(WorkspaceRole.MEMBER, 'VIEW_AUDIT_LOGS')).toBe(false)
  })
})
