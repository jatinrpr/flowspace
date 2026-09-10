import { create } from 'zustand'
import type { ChannelInfo, ChannelDetail } from '../types/channel'
import * as channelApi from '../services/channel'
import { ApiError } from '../services/api'

interface ChannelState {
  channels: ChannelInfo[]
  currentChannel: ChannelDetail | null
  currentChannelId: string | null
  members: any[]
  isLoading: boolean
  error: string | null

  fetchChannels: (workspaceId: string) => Promise<void>
  createChannel: (workspaceId: string, name: string, isPrivate: boolean, description?: string) => Promise<ChannelInfo>
  selectChannel: (channelId: string) => Promise<void>
  updateChannel: (channelId: string, name?: string, description?: string | null) => Promise<void>
  deleteChannel: (channelId: string) => Promise<void>
  fetchChannelMembers: (channelId: string) => Promise<void>
  addChannelMember: (channelId: string, userId: string) => Promise<void>
  removeChannelMember: (channelId: string, userId: string) => Promise<void>
  clearError: () => void
}

export const useChannelStore = create<ChannelState>((set, get) => ({
  channels: [],
  currentChannel: null,
  currentChannelId: null,
  members: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchChannels: async (workspaceId: string) => {
    set({ isLoading: true, error: null })
    try {
      const { channels } = await channelApi.getChannels(workspaceId)
      set({ channels, isLoading: false })
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Failed to fetch channels', isLoading: false })
    }
  },

  createChannel: async (workspaceId, name, isPrivate, description) => {
    set({ isLoading: true, error: null })
    try {
      const { channel } = await channelApi.createChannel(workspaceId, name, isPrivate, description)
      const currentChannels = get().channels
      set({ channels: [...currentChannels, channel], isLoading: false })
      return channel
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to create channel'
      set({ error: errorMsg, isLoading: false })
      throw new Error(errorMsg)
    }
  },

  selectChannel: async (channelId: string) => {
    set({ isLoading: true, error: null })
    try {
      const { channel } = await channelApi.getChannel(channelId)
      set({ currentChannel: channel, currentChannelId: channelId, isLoading: false })
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to load channel'
      set({ error: errorMsg, currentChannel: null, currentChannelId: null, isLoading: false })
      throw new Error(errorMsg)
    }
  },

  updateChannel: async (channelId, name, description) => {
    set({ isLoading: true, error: null })
    try {
      await channelApi.updateChannel(channelId, name, description)
      await get().selectChannel(channelId)
      if (get().currentChannel) {
        await get().fetchChannels(get().currentChannel!.workspaceId)
      }
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to update channel'
      set({ error: errorMsg, isLoading: false })
      throw new Error(errorMsg)
    }
  },

  deleteChannel: async (channelId) => {
    set({ isLoading: true, error: null })
    try {
      const workspaceId = get().currentChannel?.workspaceId
      await channelApi.deleteChannel(channelId)
      if (get().currentChannelId === channelId) {
        set({ currentChannel: null, currentChannelId: null })
      }
      if (workspaceId) {
        await get().fetchChannels(workspaceId)
      }
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to delete channel'
      set({ error: errorMsg, isLoading: false })
      throw new Error(errorMsg)
    }
  },

  fetchChannelMembers: async (channelId) => {
    set({ isLoading: true, error: null })
    try {
      const { members } = await channelApi.getChannelMembers(channelId)
      set({ members, isLoading: false })
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Failed to fetch channel members', isLoading: false })
    }
  },

  addChannelMember: async (channelId, userId) => {
    set({ isLoading: true, error: null })
    try {
      await channelApi.addChannelMember(channelId, userId)
      await get().fetchChannelMembers(channelId)
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to add member'
      set({ error: errorMsg, isLoading: false })
      throw new Error(errorMsg)
    }
  },

  removeChannelMember: async (channelId, userId) => {
    set({ isLoading: true, error: null })
    try {
      await channelApi.removeChannelMember(channelId, userId)
      await get().fetchChannelMembers(channelId)
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to remove member'
      set({ error: errorMsg, isLoading: false })
      throw new Error(errorMsg)
    }
  }
}))
