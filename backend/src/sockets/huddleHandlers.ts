import { Server, Socket } from 'socket.io'
import * as huddleService from '../services/huddle.service.js'

// Throttle speaking events per socket
const speakingTimestamps = new Map<string, number>()
const SPEAKING_THROTTLE_MS = 500

const broadcastHuddleState = (
  io: Server,
  huddle: huddleService.HuddleState,
  participantCount: number
) => {
  const targetId = huddle.channelId ?? huddle.conversationId!
  const targetRoom = huddle.targetType === 'channel'
    ? 'channel:' + targetId
    : 'conversation:' + targetId
  io.to(targetRoom).emit('huddle:state', {
    huddleId: huddle.id,
    targetType: huddle.targetType,
    targetId,
    participantCount
  })
}

export const registerHuddleHandlers = (io: Server, socket: Socket) => {
  const userId = socket.data.user.id
  const userName = socket.data.user.name
  const avatarUrl: string | null = socket.data.user.avatarUrl ?? null

  socket.on('huddle:join', async (
    payload: { targetType: 'channel' | 'conversation'; targetId: string },
    callback: (res: any) => void
  ) => {
    try {
      const { targetType, targetId } = payload
      if (!targetType || !targetId) {
        if (typeof callback === 'function') callback({ success: false, error: 'Missing targetType or targetId' })
        return
      }

      const { huddle } = await huddleService.createOrJoinHuddle(
        userId, userName, avatarUrl, socket.id, targetType, targetId
      )

      socket.join('huddle:' + huddle.id)

      if (typeof callback === 'function') callback({ success: true, huddle })

      // Notify existing participants
      socket.to('huddle:' + huddle.id).emit('huddle:participant-joined', {
        huddleId: huddle.id,
        participant: huddle.participants[userId]
      })

      // Broadcast count to channel/conversation room
      broadcastHuddleState(io, huddle, Object.keys(huddle.participants).length)

      console.info('[Huddle] huddle:join — User ' + userId + ' joined ' + huddle.id)
    } catch (err: any) {
      console.error('[Huddle] huddle:join error:', err.message)
      if (typeof callback === 'function') callback({ success: false, error: err.message })
    }
  })

  socket.on('huddle:leave', async (
    payload: { huddleId: string },
    callback?: (res: any) => void
  ) => {
    try {
      const { huddleId } = payload
      const room = 'huddle:' + huddleId

      const { huddle, destroyed } = await huddleService.leaveHuddle(huddleId, userId)
      socket.leave(room)

      if (destroyed && huddle) {
        io.to(room).emit('huddle:destroyed', { huddleId })
        broadcastHuddleState(io, huddle, 0)
      } else if (huddle) {
        socket.to(room).emit('huddle:participant-left', { huddleId, userId })
        broadcastHuddleState(io, huddle, Object.keys(huddle.participants).length)
      }

      if (typeof callback === 'function') callback({ success: true })
    } catch (err: any) {
      console.error('[Huddle] huddle:leave error:', err.message)
      if (typeof callback === 'function') callback({ success: false, error: err.message })
    }
  })

  socket.on('huddle:mute', async (payload: { huddleId: string }) => {
    const huddle = await huddleService.updateParticipant(payload.huddleId, userId, { muted: true })
    if (huddle) {
      io.to('huddle:' + payload.huddleId).emit('huddle:participant-updated', {
        huddleId: payload.huddleId, userId, muted: true
      })
    }
  })

  socket.on('huddle:unmute', async (payload: { huddleId: string }) => {
    const huddle = await huddleService.updateParticipant(payload.huddleId, userId, { muted: false })
    if (huddle) {
      io.to('huddle:' + payload.huddleId).emit('huddle:participant-updated', {
        huddleId: payload.huddleId, userId, muted: false
      })
    }
  })

  socket.on('huddle:speaking', async (payload: { huddleId: string; speaking: boolean }) => {
    // Throttle speaking events
    const key = socket.id + ':speaking'
    const now = Date.now()
    const last = speakingTimestamps.get(key) ?? 0
    if (now - last < SPEAKING_THROTTLE_MS) return
    speakingTimestamps.set(key, now)

    const huddle = await huddleService.updateParticipant(payload.huddleId, userId, { speaking: payload.speaking })
    if (huddle) {
      socket.to('huddle:' + payload.huddleId).emit('huddle:participant-updated', {
        huddleId: payload.huddleId, userId, speaking: payload.speaking
      })
    }
  })

  socket.on('huddle:camera-state', async (payload: { huddleId: string; enabled: boolean }) => {
    const huddle = await huddleService.updateParticipant(payload.huddleId, userId, { cameraEnabled: payload.enabled })
    if (huddle) {
      io.to('huddle:' + payload.huddleId).emit('huddle:participant-updated', {
        huddleId: payload.huddleId, userId, cameraEnabled: payload.enabled
      })
    }
  })

  socket.on('huddle:screen-share-state', async (payload: { huddleId: string; enabled: boolean }) => {
    const huddle = await huddleService.updateParticipant(payload.huddleId, userId, { screenSharing: payload.enabled })
    if (huddle) {
      io.to('huddle:' + payload.huddleId).emit('huddle:participant-updated', {
        huddleId: payload.huddleId, userId, screenSharing: payload.enabled
      })
    }
  })

  // WebRTC signaling — validate sender and recipient are in same huddle
  socket.on('webrtc:offer', async (payload: {
    huddleId: string
    targetUserId: string
    offer: RTCSessionDescriptionInit
  }) => {
    const { huddleId, targetUserId, offer } = payload
    const huddle = await huddleService.getHuddleById(huddleId)
    if (!huddle) return
    if (!huddle.participants[userId]) return
    if (!huddle.participants[targetUserId]) return
    const targetSocketId = huddle.participants[targetUserId].socketId
    io.to(targetSocketId).emit('webrtc:offer', { huddleId, fromUserId: userId, offer })
  })

  socket.on('webrtc:answer', async (payload: {
    huddleId: string
    targetUserId: string
    answer: RTCSessionDescriptionInit
  }) => {
    const { huddleId, targetUserId, answer } = payload
    const huddle = await huddleService.getHuddleById(huddleId)
    if (!huddle) return
    if (!huddle.participants[userId]) return
    if (!huddle.participants[targetUserId]) return
    const targetSocketId = huddle.participants[targetUserId].socketId
    io.to(targetSocketId).emit('webrtc:answer', { huddleId, fromUserId: userId, answer })
  })

  socket.on('webrtc:ice-candidate', async (payload: {
    huddleId: string
    targetUserId: string
    candidate: RTCIceCandidateInit
  }) => {
    const { huddleId, targetUserId, candidate } = payload
    const huddle = await huddleService.getHuddleById(huddleId)
    if (!huddle) return
    if (!huddle.participants[userId]) return
    if (!huddle.participants[targetUserId]) return
    const targetSocketId = huddle.participants[targetUserId].socketId
    io.to(targetSocketId).emit('webrtc:ice-candidate', { huddleId, fromUserId: userId, candidate })
  })
}

export const handleHuddleDisconnect = async (io: Server, socket: Socket) => {
  const { huddle, userId: disconnectedUserId, destroyed } = await huddleService.removeParticipantBySocket(socket.id)
  if (!huddle || !disconnectedUserId) return

  const room = 'huddle:' + huddle.id

  if (destroyed) {
    io.to(room).emit('huddle:destroyed', { huddleId: huddle.id })
    broadcastHuddleState(io, huddle, 0)
  } else {
    io.to(room).emit('huddle:participant-left', { huddleId: huddle.id, userId: disconnectedUserId })
    broadcastHuddleState(io, huddle, Object.keys(huddle.participants).length)
  }

  console.info('[Huddle] Cleaned up participant ' + disconnectedUserId + ' after socket disconnect')
}
