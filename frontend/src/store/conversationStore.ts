import { create } from 'zustand'
import type { ConversationInfo, ConversationDetail } from '../types/channel'
import * as conversationApi from '../services/conversation'
import { ApiError } from '../services/api'

interface ConversationState {
  conversations: ConversationInfo[]
  currentConversation: ConversationDetail | null
  currentConversationId: string | null
  isLoading: boolean
  error: string | null

  fetchConversations: (workspaceId: string) => Promise<void>
  createDirectMessage: (workspaceId: string, memberIds: string[]) => Promise<ConversationInfo>
  createGroupDM: (workspaceId: string, memberIds: string[], name?: string) => Promise<ConversationInfo>
  selectConversation: (conversationId: string) => Promise<void>
  addConversationMember: (conversationId: string, userId: string) => Promise<void>
  removeConversationMember: (conversationId: string, userId: string) => Promise<void>
  clearError: () => void
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  currentConversationId: null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchConversations: async (workspaceId: string) => {
    set({ isLoading: true, error: null })
    try {
      const { conversations } = await conversationApi.getConversations(workspaceId)
      set({ conversations, isLoading: false })
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Failed to fetch conversations', isLoading: false })
    }
  },

  createDirectMessage: async (workspaceId, memberIds) => {
    set({ isLoading: true, error: null })
    try {
      const { conversation } = await conversationApi.createConversation(workspaceId, 'DIRECT', memberIds)
      await get().fetchConversations(workspaceId)
      return conversation
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to create direct message'
      set({ error: errorMsg, isLoading: false })
      throw new Error(errorMsg)
    }
  },

  createGroupDM: async (workspaceId, memberIds, name) => {
    set({ isLoading: true, error: null })
    try {
      const { conversation } = await conversationApi.createConversation(workspaceId, 'GROUP', memberIds, name)
      await get().fetchConversations(workspaceId)
      return conversation
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to create group DM'
      set({ error: errorMsg, isLoading: false })
      throw new Error(errorMsg)
    }
  },

  selectConversation: async (conversationId: string) => {
    set({ isLoading: true, error: null })
    try {
      const { conversation } = await conversationApi.getConversation(conversationId)
      set({ currentConversation: conversation, currentConversationId: conversationId, isLoading: false })
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to load conversation'
      set({ error: errorMsg, currentConversation: null, currentConversationId: null, isLoading: false })
      throw new Error(errorMsg)
    }
  },

  addConversationMember: async (conversationId, userId) => {
    set({ isLoading: true, error: null })
    try {
      await conversationApi.addConversationMember(conversationId, userId)
      await get().selectConversation(conversationId)
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to add member'
      set({ error: errorMsg, isLoading: false })
      throw new Error(errorMsg)
    }
  },

  removeConversationMember: async (conversationId, userId) => {
    set({ isLoading: true, error: null })
    try {
      await conversationApi.removeConversationMember(conversationId, userId)
      await get().selectConversation(conversationId)
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to remove member'
      set({ error: errorMsg, isLoading: false })
      throw new Error(errorMsg)
    }
  }
}))
