import { apiRequest } from './api'
import type { ChannelInfo, ChannelDetail } from '../types/channel'

export const createChannel = async (workspaceId: string, name: string, isPrivate: boolean, description?: string) => {
  return apiRequest<{ success: boolean; channel: ChannelInfo }>(`/workspaces/${workspaceId}/channels`, {
    method: 'POST',
    body: JSON.stringify({ name, isPrivate, description }),
  })
}

export const getChannels = async (workspaceId: string) => {
  return apiRequest<{ success: boolean; channels: ChannelInfo[] }>(`/workspaces/${workspaceId}/channels`)
}

export const getChannel = async (channelId: string) => {
  return apiRequest<{ success: boolean; channel: ChannelDetail }>(`/channels/${channelId}`)
}

export const updateChannel = async (channelId: string, name?: string, description?: string | null) => {
  return apiRequest<{ success: boolean; channel: ChannelInfo }>(`/channels/${channelId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name, description }),
  })
}

export const deleteChannel = async (channelId: string) => {
  return apiRequest<{ success: boolean; message: string }>(`/channels/${channelId}`, {
    method: 'DELETE',
  })
}

export const getChannelMembers = async (channelId: string) => {
  return apiRequest<{ success: boolean; members: any[] }>(`/channels/${channelId}/members`)
}

export const addChannelMember = async (channelId: string, userId: string) => {
  return apiRequest<{ success: boolean; message: string }>(`/channels/${channelId}/members`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  })
}

export const removeChannelMember = async (channelId: string, userId: string) => {
  return apiRequest<{ success: boolean; message: string }>(`/channels/${channelId}/members/${userId}`, {
    method: 'DELETE',
  })
}
