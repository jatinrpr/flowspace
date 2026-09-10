export interface User {
  id: string
  name: string
  avatar?: string
  online: boolean
}

export interface Workspace {
  id: string
  name: string
}

export interface Channel {
  id: string
  name: string
  isPrivate: boolean
}

export interface Message {
  id: string
  senderId: string
  channelId: string
  content: string
  createdAt: string
  type: 'text' | 'image' | 'file' | 'voice'
}
