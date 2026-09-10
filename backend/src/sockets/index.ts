import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { pubClient, subClient } from '../lib/redis.js'
import { env } from '../config/env.js'
import { socketAuthMiddleware } from '../middleware/socket-auth.js'

import { registerMessageHandlers } from './messageHandlers.js'
import { registerTypingHandlers } from './typingHandlers.js'
import { registerPresenceHandlers, handleDisconnect } from './presenceHandlers.js'
import { registerReadHandlers } from './readHandlers.js'
import { registerHuddleHandlers, handleHuddleDisconnect } from './huddleHandlers.js'

export let io: Server

export function initializeSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.frontendUrl,
      credentials: true,
    }
  })

  // Only use Redis adapter if Redis is connected
  if (pubClient.status === 'ready' || pubClient.status === 'connecting') {
    io.adapter(createAdapter(pubClient, subClient))
  }

  io.use(socketAuthMiddleware)

  io.on('connection', (socket: Socket) => {
    console.info(`Socket connected: ${socket.id} (User: ${socket.data.user.id})`)
    
    // Join user's personal room
    socket.join(`user:${socket.data.user.id}`)
    
    registerPresenceHandlers(io, socket)
    registerMessageHandlers(io, socket)
    registerTypingHandlers(io, socket)
    registerReadHandlers(io, socket)
    registerHuddleHandlers(io, socket)

    socket.on('disconnect', () => {
      handleDisconnect(io, socket)
      handleHuddleDisconnect(io, socket)
    })
  })

  return io
}
