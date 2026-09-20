import type { Socket } from 'socket.io'
import cookie from 'cookie'
import { verifyAccessToken } from '../utils/token.js'
import { prisma } from '../lib/prisma.js'

export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const cookies = cookie.parse(socket.handshake.headers.cookie || '')
    const token = (socket.handshake.auth?.token as string | undefined) || cookies.access_token

    if (!token) {
      return next(new Error('Authentication error'))
    }

    const payload = verifyAccessToken(token)
    
    // Fetch user to attach basic info
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, avatarUrl: true }
    })

    if (!user) {
      return next(new Error('Authentication error'))
    }

    socket.data.user = user
    next()
  } catch (err) {
    next(new Error('Authentication error'))
  }
}
