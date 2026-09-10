import { createHash, randomBytes, randomUUID } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { AccessTokenPayload, RefreshTokenPayload } from '../types/auth.js'

export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex')

export const createOpaqueToken = (): string => randomBytes(32).toString('hex')

export const createSessionId = (): string => randomUUID()

export const createAccessToken = (userId: string): string =>
  jwt.sign({ sub: userId, type: 'access' }, env.jwtAccessSecret, {
    expiresIn: env.accessTokenExpiresIn as jwt.SignOptions['expiresIn'],
  })

export const createRefreshToken = (userId: string, sessionId: string): string =>
  jwt.sign(
    { sub: userId, sid: sessionId, type: 'refresh' },
    env.jwtRefreshSecret,
    {
      expiresIn: env.refreshTokenExpiresIn as jwt.SignOptions['expiresIn'],
    },
  )

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const payload = jwt.verify(token, env.jwtAccessSecret)

  if (
    !isRecord(payload) ||
    typeof payload.sub !== 'string' ||
    payload.type !== 'access'
  ) {
    throw new Error('Invalid access token')
  }

  return { sub: payload.sub, type: 'access' }
}

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const payload = jwt.verify(token, env.jwtRefreshSecret)

  if (
    !isRecord(payload) ||
    typeof payload.sub !== 'string' ||
    typeof payload.sid !== 'string' ||
    payload.type !== 'refresh'
  ) {
    throw new Error('Invalid refresh token')
  }

  return { sub: payload.sub, sid: payload.sid, type: 'refresh' }
}
