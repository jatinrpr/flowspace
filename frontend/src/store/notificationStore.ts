import { create } from 'zustand'
import { apiRequest } from '../services/api'

export interface AppNotification {
  id: string
  userId: string
  type: 'MENTION' | 'DM' | 'THREAD' | 'CHANNEL' | 'SYSTEM'
  message: string
  read: boolean
  messageId?: string | null
  workspaceId?: string | null
  channelId?: string | null
  conversationId?: string | null
  createdAt: string
}

interface NotificationState {
  notifications: AppNotification[]
  unreadCount: number
  isLoading: boolean
  hasMore: boolean
  nextCursor: string | null
  isPanelOpen: boolean
  
  togglePanel: () => void
  fetchUnreadCount: () => Promise<void>
  fetchNotifications: () => Promise<void>
  loadMore: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  handleRealtimeNotification: (notif: AppNotification & { unreadCount: number }) => void
  handleRoomRead: (channelId?: string, conversationId?: string, unreadCount?: number) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasMore: false,
  nextCursor: null,
  isPanelOpen: false,

  togglePanel: () => set(state => ({ isPanelOpen: !state.isPanelOpen })),

  fetchUnreadCount: async () => {
    try {
      const res = await apiRequest<{ success: boolean, count: number }>('/notifications/unread-count')
      if (res.success) {
        set({ unreadCount: res.count })
      }
    } catch (e) {
      console.error('Failed to fetch unread count', e)
    }
  },

  fetchNotifications: async () => {
    set({ isLoading: true })
    try {
      const res = await apiRequest<{ success: boolean, data: { results: AppNotification[], nextCursor: string | null, hasMore: boolean } }>('/notifications?limit=20')
      if (res.success && res.data) {
        set({
          notifications: res.data.results,
          nextCursor: res.data.nextCursor,
          hasMore: res.data.hasMore
        })
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e)
    } finally {
      set({ isLoading: false })
    }
  },

  loadMore: async () => {
    const { nextCursor, isLoading, notifications } = get()
    if (!nextCursor || isLoading) return
    
    set({ isLoading: true })
    try {
      const res = await apiRequest<{ success: boolean, data: { results: AppNotification[], nextCursor: string | null, hasMore: boolean } }>(`/notifications?limit=20&cursor=${nextCursor}`)
      if (res.success && res.data) {
        set({
          notifications: [...notifications, ...res.data.results],
          nextCursor: res.data.nextCursor,
          hasMore: res.data.hasMore
        })
      }
    } catch (e) {
      console.error('Failed to load more notifications', e)
    } finally {
      set({ isLoading: false })
    }
  },

  markAsRead: async (id: string) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' })
      set(state => {
        const notifs = state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
        return {
          notifications: notifs,
          unreadCount: Math.max(0, state.unreadCount - 1)
        }
      })
    } catch (e) {
      console.error('Failed to mark read', e)
    }
  },

  markAllAsRead: async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PATCH' })
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }))
    } catch (e) {
      console.error('Failed to mark all read', e)
    }
  },

  handleRealtimeNotification: (notif) => {
    set(state => {
      if (state.notifications.some(n => n.id === notif.id)) return state
      
      return {
        notifications: [notif, ...state.notifications],
        unreadCount: notif.unreadCount
      }
    })
  },

  handleRoomRead: (channelId?: string, conversationId?: string, unreadCount?: number) => {
    set(state => {
      const notifs = state.notifications.map(n => {
        if (!n.read && ((channelId && n.channelId === channelId) || (conversationId && n.conversationId === conversationId))) {
          return { ...n, read: true }
        }
        return n
      })
      return {
        notifications: notifs,
        unreadCount: unreadCount ?? state.unreadCount
      }
    })
  }
}))
