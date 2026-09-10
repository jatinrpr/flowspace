import { create } from 'zustand'
import { WebRTCManager } from '../services/WebRTCManager'
import { getSocket } from '../services/socket'
import { apiRequest } from '../services/api'

export interface HuddleParticipant {
  userId: string
  name: string
  avatarUrl: string | null
  joinedAt: string
  muted: boolean
  speaking: boolean
  cameraEnabled?: boolean
  screenSharing?: boolean
  socketId: string
}

export interface HuddleState {
  id: string
  targetType: 'channel' | 'conversation'
  channelId?: string
  conversationId?: string
  participants: Record<string, HuddleParticipant>
}

export interface HuddleIndicator {
  huddleId: string
  targetType: 'channel' | 'conversation'
  targetId: string
  participantCount: number
}

interface HuddleStoreState {
  activeHuddle: HuddleState | null
  isJoined: boolean
  isMuted: boolean
  isSpeaking: boolean
  cameraEnabled: boolean
  screenSharing: boolean
  isExpanded: boolean
  connectionStates: Record<string, RTCPeerConnectionState>
  remoteStreams: Record<string, MediaStream>
  localVideoTrack: MediaStreamTrack | null
  error: string | null
  isJoining: boolean
  huddleIndicators: Record<string, HuddleIndicator>
  _manager: WebRTCManager | null

  joinHuddle: (targetType: 'channel' | 'conversation', targetId: string) => Promise<void>
  leaveHuddle: () => void
  toggleMute: () => void
  toggleCamera: () => Promise<void>
  toggleScreenShare: () => Promise<void>
  setExpanded: (expanded: boolean) => void
  handleParticipantJoined: (participant: HuddleParticipant, huddleId: string) => void
  handleParticipantLeft: (userId: string, huddleId: string) => void
  handleParticipantUpdated: (huddleId: string, userId: string, updates: Partial<HuddleParticipant>) => void
  handleOffer: (fromUserId: string, offer: RTCSessionDescriptionInit, huddleId: string) => Promise<void>
  handleAnswer: (fromUserId: string, answer: RTCSessionDescriptionInit) => Promise<void>
  handleIceCandidate: (fromUserId: string, candidate: RTCIceCandidateInit) => Promise<void>
  handleHuddleState: (info: HuddleIndicator) => void
  handleHuddleDestroyed: (huddleId: string) => void
  clearError: () => void
}

export const useHuddleStore = create<HuddleStoreState>((set, get) => ({
  activeHuddle: null,
  isJoined: false,
  isMuted: false,
  isSpeaking: false,
  cameraEnabled: false,
  screenSharing: false,
  isExpanded: false,
  connectionStates: {},
  remoteStreams: {},
  localVideoTrack: null,
  error: null,
  isJoining: false,
  huddleIndicators: {},
  _manager: null,

  joinHuddle: async (targetType, targetId) => {
    set({ isJoining: true, error: null })
    const socket = getSocket()
    if (!socket) {
      set({ error: 'Not connected to server', isJoining: false })
      return
    }
    if (!navigator.mediaDevices || !window.RTCPeerConnection) {
      set({ error: 'Your browser does not support WebRTC calls.', isJoining: false })
      return
    }

    try {
      const iceRes = await apiRequest<{ success: boolean; iceServers: RTCIceServer[] }>('/huddles/ice-servers')
      const iceServers = iceRes.iceServers ?? [{ urls: 'stun:stun.l.google.com:19302' }]

      const manager = new WebRTCManager({
        socket: socket as any,
        huddleId: '',
        myUserId: '',
        iceServers,
        onSpeakingChange: (_uid, speaking) => {
          set({ isSpeaking: speaking })
          const s = getSocket()
          const { activeHuddle } = get()
          if (s && activeHuddle) s.emit('huddle:speaking', { huddleId: activeHuddle.id, speaking })
        },
        onConnectionStateChange: (uid, state) => {
          set(s => ({ connectionStates: { ...s.connectionStates, [uid]: state } }))
        },
        onRemoteStream: (uid, stream) => {
          set(s => ({ remoteStreams: { ...s.remoteStreams, [uid]: stream } }))
        },
        onRemoteStreamRemoved: (uid) => {
          set(s => {
            const rs = { ...s.remoteStreams }
            delete rs[uid]
            return { remoteStreams: rs }
          })
        }
      })

      await manager.acquireLocalStream()

      await new Promise<void>((resolve, reject) => {
        socket.emit('huddle:join', { targetType, targetId }, async (res: any) => {
          if (!res.success) { reject(new Error(res.error || 'Failed to join huddle')); return }

          const huddle: HuddleState = res.huddle
          manager.updateHuddleId(huddle.id)

          const { useAuthStore } = await import('./authStore')
          const myUserId = useAuthStore.getState().user?.id ?? ''
          manager.updateMyUserId(myUserId)

          set({
            activeHuddle: huddle,
            isJoined: true,
            isMuted: false,
            cameraEnabled: false,
            screenSharing: false,
            isExpanded: false,
            connectionStates: {},
            remoteStreams: {},
            localVideoTrack: null,
            _manager: manager,
            isJoining: false
          })

          const existingPeers = Object.keys(huddle.participants).filter(uid => uid !== myUserId)
          for (const uid of existingPeers) {
            try { await manager.createOffer(uid) } catch (e) { console.warn('[Huddle] Offer failed for', uid, e) }
          }
          resolve()
        })
      })
    } catch (err: any) {
      get()._manager?.closeAll()
      set({ error: err.message, isJoining: false, _manager: null })
    }
  },

  leaveHuddle: () => {
    const { activeHuddle, _manager } = get()
    _manager?.closeAll()
    const socket = getSocket()
    if (socket && activeHuddle) socket.emit('huddle:leave', { huddleId: activeHuddle.id })
    set({
      activeHuddle: null,
      isJoined: false,
      isMuted: false,
      isSpeaking: false,
      cameraEnabled: false,
      screenSharing: false,
      isExpanded: false,
      connectionStates: {},
      remoteStreams: {},
      localVideoTrack: null,
      _manager: null,
      error: null
    })
  },

  toggleMute: () => {
    const { isMuted, _manager, activeHuddle } = get()
    const newMuted = !isMuted
    _manager?.setMuted(newMuted)
    set({ isMuted: newMuted })
    const socket = getSocket()
    if (socket && activeHuddle) socket.emit(newMuted ? 'huddle:mute' : 'huddle:unmute', { huddleId: activeHuddle.id })
  },

  toggleCamera: async () => {
    const { cameraEnabled, _manager, activeHuddle } = get()
    if (!_manager || !activeHuddle) return
    const socket = getSocket()
    const nextState = !cameraEnabled

    try {
      if (nextState) {
        const track = await _manager.enableCamera()
        set({ cameraEnabled: true, localVideoTrack: track })
        if (socket) socket.emit('huddle:camera-state', { huddleId: activeHuddle.id, enabled: true })
      } else {
        _manager.disableCamera()
        set({ cameraEnabled: false, localVideoTrack: _manager.getActiveVideoTrack() })
        if (socket) socket.emit('huddle:camera-state', { huddleId: activeHuddle.id, enabled: false })
      }
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  toggleScreenShare: async () => {
    const { screenSharing, _manager, activeHuddle } = get()
    if (!_manager || !activeHuddle) return
    const socket = getSocket()

    if (!screenSharing) {
      try {
        const track = await _manager.startScreenShare(() => {
          // Native browser stop button clicked callback
          set({
            screenSharing: false,
            localVideoTrack: _manager.getActiveVideoTrack()
          })
          const s = getSocket()
          const { activeHuddle: ah } = get()
          if (s && ah) s.emit('huddle:screen-share-state', { huddleId: ah.id, enabled: false })
        })

        set({ screenSharing: true, localVideoTrack: track, isExpanded: true })
        if (socket) socket.emit('huddle:screen-share-state', { huddleId: activeHuddle.id, enabled: true })
      } catch (err: any) {
        set({ error: err.message })
      }
    } else {
      _manager.stopScreenShare()
      set({ screenSharing: false, localVideoTrack: _manager.getActiveVideoTrack() })
      if (socket) socket.emit('huddle:screen-share-state', { huddleId: activeHuddle.id, enabled: false })
    }
  },

  setExpanded: (expanded) => set({ isExpanded: expanded }),

  handleParticipantJoined: (participant, huddleId) => {
    const { activeHuddle } = get()
    if (!activeHuddle || activeHuddle.id !== huddleId) return
    set(s => ({
      activeHuddle: s.activeHuddle
        ? { ...s.activeHuddle, participants: { ...s.activeHuddle.participants, [participant.userId]: participant } }
        : null
    }))
  },

  handleParticipantLeft: (userId, huddleId) => {
    const { activeHuddle, _manager } = get()
    if (!activeHuddle || activeHuddle.id !== huddleId) return
    _manager?.closePeer(userId)
    set(s => {
      if (!s.activeHuddle) return s
      const participants = { ...s.activeHuddle.participants }
      delete participants[userId]
      const connectionStates = { ...s.connectionStates }
      delete connectionStates[userId]
      return { activeHuddle: { ...s.activeHuddle, participants }, connectionStates }
    })
  },

  handleParticipantUpdated: (huddleId, userId, updates) => {
    const { activeHuddle } = get()
    if (!activeHuddle || activeHuddle.id !== huddleId) return
    set(s => {
      if (!s.activeHuddle?.participants[userId]) return s
      return {
        activeHuddle: {
          ...s.activeHuddle,
          participants: {
            ...s.activeHuddle.participants,
            [userId]: { ...s.activeHuddle.participants[userId], ...updates }
          }
        }
      }
    })
  },

  handleOffer: async (fromUserId, offer, huddleId) => {
    const { activeHuddle, _manager } = get()
    if (!activeHuddle || activeHuddle.id !== huddleId || !_manager) return
    try { await _manager.handleOffer(fromUserId, offer) } catch (e) { console.error('[Huddle] handleOffer:', e) }
  },

  handleAnswer: async (fromUserId, answer) => {
    const { _manager } = get()
    if (!_manager) return
    try { await _manager.handleAnswer(fromUserId, answer) } catch (e) { console.error('[Huddle] handleAnswer:', e) }
  },

  handleIceCandidate: async (fromUserId, candidate) => {
    const { _manager } = get()
    if (!_manager) return
    try { await _manager.handleIceCandidate(fromUserId, candidate) } catch (e) { console.warn('[Huddle] handleIceCandidate:', e) }
  },

  handleHuddleState: (info) => {
    set(s => ({
      huddleIndicators: { ...s.huddleIndicators, [info.targetId]: info }
    }))
  },

  handleHuddleDestroyed: (huddleId) => {
    const { activeHuddle, _manager } = get()
    if (activeHuddle?.id === huddleId) {
      _manager?.closeAll()
      set({ activeHuddle: null, isJoined: false, isMuted: false, isSpeaking: false, _manager: null })
    }
    set(s => {
      const indicators = { ...s.huddleIndicators }
      for (const key of Object.keys(indicators)) {
        if (indicators[key].huddleId === huddleId) delete indicators[key]
      }
      return { huddleIndicators: indicators }
    })
  },

  clearError: () => set({ error: null })
}))
