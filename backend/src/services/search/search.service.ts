import { SearchProvider, SearchResult } from './search.provider.js'
import { PostgresSearchProvider } from './postgres-search.provider.js'

// We can swap this out for OpenSearchSearchProvider later
const currentSearchProvider: SearchProvider = new PostgresSearchProvider()

export const searchMessages = async (
  workspaceId: string,
  userId: string,
  query: string,
  limit?: number,
  cursor?: string
): Promise<SearchResult> => {
  return currentSearchProvider.searchMessages(workspaceId, userId, query, limit, cursor)
}
