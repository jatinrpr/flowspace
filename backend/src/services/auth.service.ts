import bcrypt from 'bcryptjs'
import type { Request } from 'express'
import { env, isProduction } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import type { SafeUser } from '../types/auth.js'
import { toSafeUser } from '../types/auth.js'
import { AppError } from '../utils/app-error.js'
import { durationToMilliseconds } from '../utils/duration.js'
import {
  createAccessToken,
  createOpaqueToken,
  createRefreshToken,
  createSessionId,
  hashToken,
  verifyRefreshToken,
} from '../utils/token.js'

const saltRounds = 12
const resetMessage =
  'If an account exists for this email, password reset instructions have been sent.'

interface TokenPair {
  accessToken: string
  refreshToken: string
}

interface AuthResult extends TokenPair {
  user: SafeUser
}

interface RequestMetadata {
  userAgent: string | null
  ipAddress: string | null
}

const getRequestMetadata = (request: Request): RequestMetadata => ({
  userAgent: request.get('user-agent') ?? null,
  ipAddress: request.ip ?? null,
})

const issueSession = async (
  userId: string,
  metadata: RequestMetadata,
): Promise<TokenPair> => {
  const sessionId = createSessionId()
  const refreshToken = createRefreshToken(userId, sessionId)
  const expiresAt = new Date(
    Date.now() + durationToMilliseconds(env.refreshTokenExpiresIn),
  )

  await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
    },
  })

  return { accessToken: createAccessToken(userId), refreshToken }
}

export const signup = async (
  input: { name: string; email: string; password: string },
  request: Request,
): Promise<AuthResult> => {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  })

  if (existingUser) {
    throw new AppError('An account with this email already exists', 409)
  }

  const passwordHash = await bcrypt.hash(input.password, saltRounds)
  const metadata = getRequestMetadata(request)
  const sessionId = createSessionId()

  // The actual signed refresh token is generated after the user ID exists.
  const result = await prisma.$transaction(async (transaction) => {
    const user = await transaction.user.create({
      data: { name: input.name, email: input.email, passwordHash },
    })
    const actualRefreshToken = createRefreshToken(user.id, sessionId)
    const expiresAt = new Date(
      Date.now() + durationToMilliseconds(env.refreshTokenExpiresIn),
    )

    await transaction.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        tokenHash: hashToken(actualRefreshToken),
        expiresAt,
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
      },
    })

    return { user, actualRefreshToken }
  })

  return {
    user: toSafeUser(result.user),
    accessToken: createAccessToken(result.user.id),
    refreshToken: result.actualRefreshToken,
  }
}

export const login = async (
  input: { email: string; password: string },
  request: Request,
): Promise<AuthResult> => {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  const passwordMatches = user
    ? await bcrypt.compare(input.password, user.passwordHash)
    : false

  if (!user || !passwordMatches) {
    throw new AppError('Invalid email or password', 401)
  }

  const tokens = await issueSession(user.id, getRequestMetadata(request))
  return { user: toSafeUser(user), ...tokens }
}

export const getCurrentUser = async (userId: string): Promise<SafeUser> => {
  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user) {
    throw new AppError('Authentication required', 401)
  }

  return toSafeUser(user)
}

export const refresh = async (
  refreshToken: string,
  request: Request,
): Promise<TokenPair> => {
  let payload

  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw new AppError('Invalid or expired refresh token', 401)
  }

  const session = await prisma.session.findUnique({
    where: { id: payload.sid },
  })

  if (
    !session ||
    session.userId !== payload.sub ||
    session.tokenHash !== hashToken(refreshToken) ||
    session.revokedAt ||
    session.expiresAt <= new Date()
  ) {
    throw new AppError('Invalid or expired refresh token', 401)
  }

  const newSessionId = createSessionId()
  const newRefreshToken = createRefreshToken(payload.sub, newSessionId)
  const expiresAt = new Date(
    Date.now() + durationToMilliseconds(env.refreshTokenExpiresIn),
  )
  const metadata = getRequestMetadata(request)

  await prisma.$transaction(async (transaction) => {
    const revoked = await transaction.session.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: new Date() },
    })

    if (revoked.count !== 1) {
      throw new AppError('Invalid or expired refresh token', 401)
    }

    await transaction.session.create({
      data: {
        id: newSessionId,
        userId: payload.sub,
        tokenHash: hashToken(newRefreshToken),
        expiresAt,
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
      },
    })
  })

  return {
    accessToken: createAccessToken(payload.sub),
    refreshToken: newRefreshToken,
  }
}

export const logout = async (refreshToken?: string): Promise<void> => {
  if (!refreshToken) {
    return
  }

  try {
    const payload = verifyRefreshToken(refreshToken)
    await prisma.session.updateMany({
      where: {
        id: payload.sid,
        userId: payload.sub,
        tokenHash: hashToken(refreshToken),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    })
  } catch {
    // Cookie clearing is intentionally still successful for an invalid token.
  }
}

export const forgotPassword = async (email: string): Promise<string> => {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return resetMessage
  }

  const rawToken = createOpaqueToken()
  const expiresAt = new Date(
    Date.now() + durationToMilliseconds(env.resetPasswordTokenExpiresIn),
  )

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt },
    }),
  ])

  if (!isProduction) {
    console.info(
      `Password reset URL for ${user.email}: ${env.frontendUrl}/reset-password?token=${rawToken}`,
    )
  }

  return resetMessage
}

export const resetPassword = async (input: {
  token: string
  password: string
}): Promise<void> => {
  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash: hashToken(input.token),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  })

  if (!resetToken) {
    throw new AppError('Invalid or expired password reset token', 400)
  }

  const passwordHash = await bcrypt.hash(input.password, saltRounds)

  await prisma.$transaction(async (transaction) => {
    const consumed = await transaction.passwordResetToken.updateMany({
      where: { id: resetToken.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    })

    if (consumed.count !== 1) {
      throw new AppError('Invalid or expired password reset token', 400)
    }

    await transaction.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    })
    await transaction.session.updateMany({
      where: { userId: resetToken.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  })
}
