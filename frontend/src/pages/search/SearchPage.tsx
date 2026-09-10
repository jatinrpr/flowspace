import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { apiRequest } from '../../services/api'
import { MessageItem } from '../../components/message/MessageItem'
import { Search } from 'lucide-react'

export function SearchPage() {
  const { workspaceId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const q = searchParams.get('q') || ''
  
  const [results, setResults] = useState<any[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [inputValue, setInputValue] = useState(q)

  useEffect(() => {
    setInputValue(q)
    if (!q) {
      setResults([])
      setNextCursor(null)
      setHasMore(false)
      return
    }

    const fetchResults = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await apiRequest<{ success: boolean, data?: { results: any[], nextCursor: string | null, hasMore: boolean }, error?: string }>(
          `/workspaces/${workspaceId}/search/messages?q=${encodeURIComponent(q)}&limit=20`
        )
        
        if (res.success && res.data) {
          setResults(res.data.results)
          setNextCursor(res.data.nextCursor)
          setHasMore(res.data.hasMore)
        } else {
          setError(res.error || 'Failed to search messages')
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [q, workspaceId])

  const loadMore = async () => {
    if (!nextCursor || isLoading) return
    setIsLoading(true)
    try {
      const res = await apiRequest<{ success: boolean, data?: { results: any[], nextCursor: string | null, hasMore: boolean } }>(
        `/workspaces/${workspaceId}/search/messages?q=${encodeURIComponent(q)}&limit=20&cursor=${nextCursor}`
      )
      
      if (res.success && res.data) {
        setResults(prev => [...prev, ...res.data!.results])
        setNextCursor(res.data.nextCursor)
        setHasMore(res.data.hasMore)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load more')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue })
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
      <header className="flex h-14 shrink-0 items-center border-b border-slate-200 dark:border-slate-800 px-4 md:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Search size={20} className="text-slate-500" />
          <h1>Search Results</h1>
        </div>
      </header>
      
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSubmit} className="max-w-3xl">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search messages (e.g. hello from:john in:general has:file)"
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </form>
        <div className="mt-2 text-xs text-slate-500">
          Supported operators: <code>from:</code>, <code>in:</code>, <code>has:file</code>, <code>has:voice</code>, <code>after:YYYY-MM-DD</code>, <code>before:YYYY-MM-DD</code>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:px-6">
        {error && (
          <div className="p-4 mb-4 bg-red-100 text-red-700 rounded border border-red-200">
            {error}
          </div>
        )}
        
        {isLoading && results.length === 0 && (
          <div className="text-slate-500">Searching...</div>
        )}

        {!isLoading && !error && q && results.length === 0 && (
          <div className="text-slate-500">No results found for "{q}".</div>
        )}

        <div className="space-y-6 max-w-3xl">
          {results.map((message) => (
            <div 
              key={message.id} 
              className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              onClick={() => {
                if (message.channelId) navigate(`/workspace/${workspaceId}/channel/${message.channelId}`)
                else if (message.conversationId) navigate(`/workspace/${workspaceId}/dm/${message.conversationId}`)
              }}
            >
              <div className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                {message.channel ? (
                  <span># {message.channel.name}</span>
                ) : message.conversation ? (
                  <span>Direct Message</span>
                ) : null}
              </div>
              <MessageItem message={message} />
            </div>
          ))}
        </div>
        
        {hasMore && (
          <button 
            onClick={loadMore}
            disabled={isLoading}
            className="mt-6 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        )}
      </div>
    </div>
  )
}
