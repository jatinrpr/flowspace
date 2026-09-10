export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export interface WorkspaceInfo {
  id: string
  name: string
  slug: string
  role: WorkspaceRole
}

export interface WorkspaceDetail extends WorkspaceInfo {
  createdAt: string
  memberCount: number
}

export interface WorkspaceMember {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  role: WorkspaceRole
}

export interface WorkspaceInvitation {
  id: string
  email: string
  expiresAt: string
  createdAt: string
}
