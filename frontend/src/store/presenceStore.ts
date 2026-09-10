import { create } from 'zustand'
import { getSocket } from '../services/socket'

interface PresenceState {
  userStatus: Record<string, 'ONLINE' | 'AWAY' | 'OFFLINE'>
  lastSeenAt: Record<string, string>
  
  updatePresence: (userId: string, status: 'ONLINE' | 'AWAY' | 'OFFLINE', lastSeenAt?: string) => void
  setManualStatus: (status: 'ONLINE' | 'AWAY') => void
}

export const usePresenceStore = create<PresenceState>((set) => ({
  userStatus: {},
  lastSeenAt: {},

  updatePresence: (userId, status, lastSeenAt) => {
    set(state => ({
      userStatus: { ...state.userStatus, [userId]: status },
      lastSeenAt: lastSeenAt ? { ...state.lastSeenAt, [userId]: lastSeenAt } : state.lastSeenAt
    }))
  },

  setManualStatus: (status) => {
    const socket = getSocket()
    if (socket) {
      socket.emit('presence:activity', { status })
    }
  }
}))
