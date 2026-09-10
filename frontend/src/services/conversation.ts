import { apiRequest } from './api'
import type { ConversationInfo, ConversationDetail } from '../types/channel'

export const createConversation = async (workspaceId: string, type: 'DIRECT' | 'GROUP', memberIds: string[], name?: string) => {
  return apiRequest<{ success: boolean; conversation: ConversationInfo }>(`/workspaces/${workspaceId}/conversations`, {
    method: 'POST',
    body: JSON.stringify({ type, memberIds, name }),
  })
}

export const getConversations = async (workspaceId: string) => {
  return apiRequest<{ success: boolean; conversations: ConversationInfo[] }>(`/workspaces/${workspaceId}/conversations`)
}

export const getConversation = async (conversationId: string) => {
  return apiRequest<{ success: boolean; conversation: ConversationDetail }>(`/conversations/${conversationId}`)
}

export const deleteConversation = async (conversationId: string) => {
  return apiRequest<{ success: boolean; message: string }>(`/conversations/${conversationId}`, {
    method: 'DELETE',
  })
}

export const addConversationMember = async (conversationId: string, userId: string) => {
  return apiRequest<{ success: boolean; message: string }>(`/conversations/${conversationId}/members`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  })
}

export const removeConversationMember = async (conversationId: string, userId: string) => {
  return apiRequest<{ success: boolean; message: string }>(`/conversations/${conversationId}/members/${userId}`, {
    method: 'DELETE',
  })
}
