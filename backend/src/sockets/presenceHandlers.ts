import { Server, Socket } from 'socket.io'
import { pubClient } from '../lib/redis.js'
import { prisma } from '../lib/prisma.js'

const localConnections = new Map<string, { connections: number, status: string, lastSeenAt: string }>()

export const registerPresenceHandlers = async (io: Server, socket: Socket) => {
  const userId = socket.data.user.id
  
  socket.on('room:join', async (payload, callback) => {
    try {
      if (payload.channelId) {
        socket.join(`channel:${payload.channelId}`)
      } else if (payload.conversationId) {
        socket.join(`conversation:${payload.conversationId}`)
      }
      if (typeof callback === 'function') callback({ success: true })
    } catch (err: any) {
      if (typeof callback === 'function') callback({ success: false, error: err.message })
    }
  })

  socket.on('room:leave', (payload) => {
    if (payload.channelId) {
      socket.leave(`channel:${payload.channelId}`)
    } else if (payload.conversationId) {
      socket.leave(`conversation:${payload.conversationId}`)
    }
  })

  socket.on('presence:activity', async (payload: { status: 'ONLINE' | 'AWAY' }) => {
    const isRedisReady = pubClient.status === 'ready'
    if (isRedisReady) {
      const presenceKey = `presence:user:${userId}`
      const data = await pubClient.get(presenceKey)
      if (data) {
        const parsed = JSON.parse(data)
        parsed.status = payload.status
        parsed.lastSeenAt = new Date().toISOString()
        await pubClient.set(presenceKey, JSON.stringify(parsed))
      }
    } else {
      const data = localConnections.get(userId)
      if (data) {
        data.status = payload.status
        data.lastSeenAt = new Date().toISOString()
      }
    }
    
    await prisma.user.update({ 
      where: { id: userId }, 
      data: { status: payload.status === 'ONLINE' ? 'ACTIVE' : 'AWAY' } 
    }).catch(() => {})
    
    io.emit('presence:update', { userId, status: payload.status, lastSeenAt: new Date().toISOString() })
  })

  const isRedisReady = pubClient.status === 'ready'
  let newStatus = 'ONLINE'

  if (isRedisReady) {
    const presenceKey = `presence:user:${userId}`
    const existing = await pubClient.get(presenceKey)
    let parsed = existing ? JSON.parse(existing) : { connections: 0, status: 'ONLINE', lastSeenAt: new Date().toISOString() }
    
    parsed.connections += 1
    if (parsed.status === 'OFFLINE') parsed.status = 'ONLINE'
    newStatus = parsed.status
    
    await pubClient.set(presenceKey, JSON.stringify(parsed))
  } else {
    let existing = localConnections.get(userId) || { connections: 0, status: 'ONLINE', lastSeenAt: new Date().toISOString() }
    existing.connections += 1
    if (existing.status === 'OFFLINE') existing.status = 'ONLINE'
    newStatus = existing.status
    localConnections.set(userId, existing)
  }
  
  await prisma.user.update({ 
    where: { id: userId }, 
    data: { status: newStatus === 'ONLINE' ? 'ACTIVE' : 'AWAY' } 
  }).catch(() => {})
  
  io.emit('presence:update', { userId, status: newStatus, lastSeenAt: new Date().toISOString() })
}

export const handleDisconnect = async (io: Server, socket: Socket) => {
  const userId = socket.data.user?.id
  if (!userId) return

  const isRedisReady = pubClient.status === 'ready'
  let connections = 0
  // let finalStatus = 'OFFLINE'
  let lastSeenAt = new Date().toISOString()

  if (isRedisReady) {
    const presenceKey = `presence:user:${userId}`
    const existing = await pubClient.get(presenceKey)
    if (existing) {
      const parsed = JSON.parse(existing)
      parsed.connections = Math.max(0, parsed.connections - 1)
      connections = parsed.connections
      parsed.lastSeenAt = lastSeenAt
      
      if (connections === 0) {
        parsed.status = 'OFFLINE'
      }
      // finalStatus = parsed.status
      
      if (connections === 0) {
        await pubClient.del(presenceKey)
      } else {
        await pubClient.set(presenceKey, JSON.stringify(parsed))
      }
    }
  } else {
    const existing = localConnections.get(userId)
    if (existing) {
      existing.connections = Math.max(0, existing.connections - 1)
      connections = existing.connections
      existing.lastSeenAt = lastSeenAt
      
      if (connections === 0) {
        existing.status = 'OFFLINE'
        localConnections.delete(userId)
      } else {
        // finalStatus = existing.status
      }
    }
  }

  if (connections === 0) {
    await prisma.user.update({ where: { id: userId }, data: { status: 'OFFLINE' } }).catch(() => {})
    io.emit('presence:update', { userId, status: 'OFFLINE', lastSeenAt })
  }
}
