import { create } from 'zustand'
import { apiRequest } from '../services/api'


export interface Reaction {
  id: string
  emoji: string
  userId: string
  user?: { id: string; name: string }
}

export interface ThreadReplyCount {
  _count: { replies: number }
}

export interface FileAttachment {
  id: string
  originalName: string
  url: string
  mimeType: string
  size: number
}

export interface MessageMention {
  id: string
  mentionedUserId: string
  user?: { id: string; name: string }
}

export interface Message {
  id: string
  content: string
  type: string
  senderId: string
  channelId?: string | null
  conversationId?: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  clientMessageId?: string | null
  sender: {
    id: string
    name: string
    avatarUrl: string | null
    email: string
  }
  reactions?: Reaction[]
  files?: FileAttachment[]
  mentions?: MessageMention[]
  thread?: ThreadReplyCount
}

interface MessageState {
  messages: Record<string, Message[]>
  nextCursors: Record<string, string | null>
  isLoading: boolean
  error: string | null

  fetchMessages: (roomId: string, type: 'channel' | 'conversation', cursor?: string) => Promise<void>
  addMessage: (roomId: string, message: Message) => void
  updateMessage: (roomId: string, message: Message) => void
  removeMessage: (roomId: string, messageId: string, deletedAt: string) => void
  clearMessages: (roomId: string) => void
  
  addReaction: (roomId: string, messageId: string, reaction: Reaction) => void
  removeReaction: (roomId: string, messageId: string, reactionId: string) => void
  incrementThreadReply: (roomId: string, messageId: string) => void
  addFile: (roomId: string, messageId: string, file: FileAttachment) => void
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: {},
  nextCursors: {},
  isLoading: false,
  error: null,

  fetchMessages: async (roomId, type, cursor) => {
    set({ isLoading: true, error: null })
    try {
      const endpoint = type === 'channel' 
        ? `/channels/${roomId}/messages` 
        : `/conversations/${roomId}/messages`
      
      const params = new URLSearchParams()
      if (cursor) params.append('cursor', cursor)
      
      const url = `${endpoint}?${params.toString()}`
      
      const response = await apiRequest<{ success: boolean, messages: Message[], nextCursor?: string }>(url)
      
      set(state => {
        const existing = state.messages[roomId] || []
        // Combine keeping chronological order (older messages come first if we're fetching history?)
        // The API returns older messages first (reverse chronological in query, then reversed).
        // Wait, if it's history, we usually prepend them.
        // Let's assume the API returns oldest first.
        const combined = cursor ? [...response.messages, ...existing] : response.messages
        
        // Remove duplicates just in case
        const unique = combined.filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i)
        
        return {
          messages: { ...state.messages, [roomId]: unique },
          nextCursors: { ...state.nextCursors, [roomId]: response.nextCursor || null },
          isLoading: false
        }
      })
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  },

  addMessage: (roomId, message) => {
    set(state => {
      const roomMsgs = state.messages[roomId] || []
      // Check if it's already there (idempotency)
      if (roomMsgs.some(m => m.id === message.id || (message.clientMessageId && m.clientMessageId === message.clientMessageId))) {
        return state
      }
      return {
        messages: { ...state.messages, [roomId]: [...roomMsgs, message] }
      }
    })
  },

  updateMessage: (roomId, message) => {
    set(state => {
      const roomMsgs = state.messages[roomId] || []
      return {
        messages: {
          ...state.messages,
          [roomId]: roomMsgs.map(m => m.id === message.id ? message : m)
        }
      }
    })
  },

  removeMessage: (roomId, messageId, deletedAt) => {
    set(state => {
      const roomMsgs = state.messages[roomId] || []
      return {
        messages: {
          ...state.messages,
          [roomId]: roomMsgs.map(m => m.id === messageId ? { ...m, deletedAt } : m)
        }
      }
    })
  },

  clearMessages: (roomId) => {
    set(state => {
      const newMessages = { ...state.messages }
      delete newMessages[roomId]
      return { messages: newMessages }
    })
  },

  addReaction: (roomId, messageId, reaction) => {
    set(state => {
      const roomMsgs = state.messages[roomId] || []
      return {
        messages: {
          ...state.messages,
          [roomId]: roomMsgs.map(m => {
            if (m.id === messageId) {
              const reactions = m.reactions || []
              if (reactions.some(r => r.id === reaction.id)) return m
              return { ...m, reactions: [...reactions, reaction] }
            }
            return m
          })
        }
      }
    })
  },

  removeReaction: (roomId, messageId, reactionId) => {
    set(state => {
      const roomMsgs = state.messages[roomId] || []
      return {
        messages: {
          ...state.messages,
          [roomId]: roomMsgs.map(m => {
            if (m.id === messageId) {
              return { ...m, reactions: (m.reactions || []).filter(r => r.id !== reactionId) }
            }
            return m
          })
        }
      }
    })
  },

  incrementThreadReply: (roomId, messageId) => {
    set(state => {
      const roomMsgs = state.messages[roomId] || []
      return {
        messages: {
          ...state.messages,
          [roomId]: roomMsgs.map(m => {
            if (m.id === messageId) {
              const current = m.thread?._count.replies || 0
              return { ...m, thread: { _count: { replies: current + 1 } } }
            }
            return m
          })
        }
      }
    })
  },

  addFile: (roomId, messageId, file) => {
    set(state => {
      const roomMsgs = state.messages[roomId] || []
      return {
        messages: {
          ...state.messages,
          [roomId]: roomMsgs.map(m => {
            if (m.id === messageId) {
              const files = m.files || []
              if (files.some(f => f.id === file.id)) return m
              return { ...m, files: [...files, file] }
            }
            return m
          })
        }
      }
    })
  }
}))
