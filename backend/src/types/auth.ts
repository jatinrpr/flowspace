import type { User, UserStatus } from '@prisma/client'

export interface SafeUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  status: UserStatus
}

export const toSafeUser = (user: User): SafeUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl,
  status: user.status,
})

export interface AccessTokenPayload {
  sub: string
  type: 'access'
}

export interface RefreshTokenPayload {
  sub: string
  sid: string
  type: 'refresh'
}
