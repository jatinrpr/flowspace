export interface ChannelInfo {
  id: string
  workspaceId: string
  name: string
  description: string | null
  isPrivate: boolean
  createdById: string
  createdAt: string
  _count?: {
    members: number
  }
}

export interface ChannelDetail extends ChannelInfo {
  members: Array<{
    id: string
    name: string
    email: string
    avatarUrl: string | null
  }>
}

export interface ConversationInfo {
  id: string
  workspaceId: string
  type: 'DIRECT' | 'GROUP'
  name: string | null
  createdById: string
  createdAt: string
  members: Array<{
    userId: string
    joinedAt: string
    user: {
      id: string
      name: string
      email: string
      avatarUrl: string | null
    }
  }>
}

export interface ConversationDetail extends ConversationInfo {
}
