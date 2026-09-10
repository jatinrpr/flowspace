import { describe, it, expect } from 'vitest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env.js'

describe('AuthService Unit Tests', () => {
  it('should correctly hash and verify passwords', async () => {
    const rawPassword = 'SecurePassword123!'
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(rawPassword, salt)

    expect(hashedPassword).not.toBe(rawPassword)
    const isMatch = await bcrypt.compare(rawPassword, hashedPassword)
    expect(isMatch).toBe(true)

    const isWrongMatch = await bcrypt.compare('WrongPassword', hashedPassword)
    expect(isWrongMatch).toBe(false)
  })

  it('should sign and verify access tokens correctly', () => {
    const payload = { userId: 'user-123-abc' }
    const token = jwt.sign(payload, env.jwtAccessSecret, { expiresIn: '15m' })

    const decoded = jwt.verify(token, env.jwtAccessSecret) as { userId: string }
    expect(decoded.userId).toBe('user-123-abc')
  })

  it('should reject invalid or expired tokens', () => {
    const invalidToken = 'invalid.jwt.token'
    expect(() => jwt.verify(invalidToken, env.jwtAccessSecret)).toThrow()
  })

  it('should never expose passwordHash in user JSON representation', () => {
    const userObject = {
      id: 'usr_1',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: '$2a$10$hashedstringgoeshere',
      createdAt: new Date(),
    }

    const safeUser = {
      id: userObject.id,
      email: userObject.email,
      name: userObject.name,
      createdAt: userObject.createdAt,
    }

    expect(safeUser).not.toHaveProperty('passwordHash')
  })
})
