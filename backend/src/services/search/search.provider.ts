import { Message, User, Channel, Conversation, File } from '@prisma/client'

export interface SearchResultItem extends Message {
  sender: Pick<User, 'id' | 'name' | 'avatarUrl'>
  channel: Pick<Channel, 'id' | 'name'> | null
  conversation: Pick<Conversation, 'id' | 'type' | 'name'> | null
  files: File[]
}

export interface SearchResult {
  results: SearchResultItem[]
  nextCursor: string | null
  hasMore: boolean
}

export interface SearchProvider {
  searchMessages(
    workspaceId: string,
    userId: string,
    query: string,
    limit?: number,
    cursor?: string
  ): Promise<SearchResult>
}
