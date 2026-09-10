export type UserStatus = 'ACTIVE' | 'AWAY' | 'OFFLINE'

export interface AuthUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  status: UserStatus
}
