import { io, Socket } from 'socket.io-client'
import { useMessageStore } from '../store/messageStore'

import { create } from 'zustand'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000')

let socket: Socket | null = null

interface SocketState {
  isConnected: boolean
  isConnecting: boolean
  typingUsers: Record<string, { userId: string, userName?: string }[]>
  presence: Record<string, 'ONLINE' | 'OFFLINE'>
}

export const useSocketStore = create<SocketState>(() => ({
  isConnected: false,
  isConnecting: false,
  typingUsers: {},
  presence: {}
}))

export const initializeSocket = () => {
  if (socket?.connected) return socket

  useSocketStore.setState({ isConnecting: true })

  const token = typeof window !== 'undefined' ? localStorage.getItem('flowspace_token') : null

  socket = io(SOCKET_URL, {
    withCredentials: true,
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
  })

  socket.on('connect', () => {
    useSocketStore.setState({ isConnected: true, isConnecting: false })
  })

  socket.on('disconnect', () => {
    useSocketStore.setState({ isConnected: false })
  })

  socket.on('message:new', (message) => {
    const roomId = message.channelId || message.conversationId
    if (roomId) {
      useMessageStore.getState().addMessage(roomId, message)
    }
  })

  socket.on('message:updated', (message) => {
    const roomId = message.channelId || message.conversationId
    if (roomId) {
      useMessageStore.getState().updateMessage(roomId, message)
    }
  })

  socket.on('message:deleted', ({ messageId, deletedAt, channelId, conversationId }) => {
    const roomId = channelId || conversationId
    if (roomId) {
      useMessageStore.getState().removeMessage(roomId, messageId, deletedAt)
    }
  })

  socket.on('reaction:added', ({ messageId, reaction, roomId }) => {
    if (roomId) useMessageStore.getState().addReaction(roomId, messageId, reaction)
  })

  socket.on('reaction:removed', ({ messageId, reactionId, roomId }) => {
    if (roomId) useMessageStore.getState().removeReaction(roomId, messageId, reactionId)
  })

  socket.on('thread:reply:new', ({ parentMessageId, roomId }) => {
    // Increment the count in the main message list
    if (roomId) useMessageStore.getState().incrementThreadReply(roomId, parentMessageId)
  })

  socket.on('file:uploaded', (payload: any) => {
    if (payload.roomId) {
      useMessageStore.getState().addFile(payload.roomId, payload.messageId, payload.file)
    }
  })

  socket.on('typing:start', ({ userId, userName, channelId, conversationId }) => {
    const roomId = channelId || conversationId
    if (!roomId) return

    useSocketStore.setState(state => {
      const roomTyping = state.typingUsers[roomId] || []
      if (!roomTyping.some(u => u.userId === userId)) {
        return {
          typingUsers: { ...state.typingUsers, [roomId]: [...roomTyping, { userId, userName }] }
        }
      }
      return state
    })
  })

  socket.on('typing:stop', ({ userId, channelId, conversationId }) => {
    const roomId = channelId || conversationId
    if (!roomId) return

    useSocketStore.setState(state => {
      const roomTyping = state.typingUsers[roomId] || []
      return {
        typingUsers: { ...state.typingUsers, [roomId]: roomTyping.filter(u => u.userId !== userId) }
      }
    })
  })

  socket.on('presence:update', ({ userId, status, lastSeenAt }) => {
    useSocketStore.setState(state => ({
      presence: { ...state.presence, [userId]: status }
    }))
    
    // Dynamic import to avoid circular dependency
    import('../store/presenceStore').then(({ usePresenceStore }) => {
      usePresenceStore.getState().updatePresence(userId, status, lastSeenAt)
    })
  })

  socket.on('notification:new', (notif) => {
    import('../store/notificationStore').then(({ useNotificationStore }) => {
      useNotificationStore.getState().handleRealtimeNotification(notif)
    })
  })

  socket.on('notification:room_read', ({ channelId, conversationId, unreadCount }) => {
    import('../store/notificationStore').then(({ useNotificationStore }) => {
      useNotificationStore.getState().handleRoomRead(channelId, conversationId, unreadCount)
    })
  })

  socket.on('huddle:participant-joined', ({ huddleId, participant }) => {
    import('../store/huddleStore').then(({ useHuddleStore }) => {
      useHuddleStore.getState().handleParticipantJoined(participant, huddleId)
    })
  })

  socket.on('huddle:participant-left', ({ huddleId, userId }) => {
    import('../store/huddleStore').then(({ useHuddleStore }) => {
      useHuddleStore.getState().handleParticipantLeft(userId, huddleId)
    })
  })

  socket.on('huddle:participant-updated', ({ huddleId, userId, ...updates }) => {
    import('../store/huddleStore').then(({ useHuddleStore }) => {
      useHuddleStore.getState().handleParticipantUpdated(huddleId, userId, updates)
    })
  })

  socket.on('huddle:state', (info) => {
    import('../store/huddleStore').then(({ useHuddleStore }) => {
      useHuddleStore.getState().handleHuddleState(info)
    })
  })

  socket.on('huddle:destroyed', ({ huddleId }) => {
    import('../store/huddleStore').then(({ useHuddleStore }) => {
      useHuddleStore.getState().handleHuddleDestroyed(huddleId)
    })
  })

  socket.on('webrtc:offer', ({ huddleId, fromUserId, offer }) => {
    import('../store/huddleStore').then(({ useHuddleStore }) => {
      useHuddleStore.getState().handleOffer(fromUserId, offer, huddleId)
    })
  })

  socket.on('webrtc:answer', ({ fromUserId, answer }) => {
    import('../store/huddleStore').then(({ useHuddleStore }) => {
      useHuddleStore.getState().handleAnswer(fromUserId, answer)
    })
  })

  socket.on('webrtc:ice-candidate', ({ fromUserId, candidate }) => {
    import('../store/huddleStore').then(({ useHuddleStore }) => {
      useHuddleStore.getState().handleIceCandidate(fromUserId, candidate)
    })
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
    useSocketStore.setState({ isConnected: false, isConnecting: false })
  }
}

export const getSocket = () => socket

export const joinRoom = (channelId?: string, conversationId?: string) => {
  socket?.emit('room:join', { channelId, conversationId })
}

export const leaveRoom = (channelId?: string, conversationId?: string) => {
  socket?.emit('room:leave', { channelId, conversationId })
}

export const sendSocketMessage = (payload: any, callback?: (res: any) => void) => {
  socket?.emit('message:send', payload, callback)
}

export const editSocketMessage = (payload: any, callback?: (res: any) => void) => {
  socket?.emit('message:edit', payload, callback)
}

export const deleteSocketMessage = (payload: any, callback?: (res: any) => void) => {
  socket?.emit('message:delete', payload, callback)
}

export const emitTypingStart = (channelId?: string, conversationId?: string) => {
  socket?.emit('typing:start', { channelId, conversationId })
}

export const emitTypingStop = (channelId?: string, conversationId?: string) => {
  socket?.emit('typing:stop', { channelId, conversationId })
}
