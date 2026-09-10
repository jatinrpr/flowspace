import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useChannelStore } from '../../store/channelStore'
import { useMessageStore } from '../../store/messageStore'
import { MessageList } from '../../components/message/MessageList'
import { MessageInput } from '../../components/message/MessageInput'
import { ThreadPanel } from '../../components/message/ThreadPanel'
import { joinRoom, leaveRoom } from '../../services/socket'
import { HuddleButton } from '../../components/huddle/HuddleButton'

export function ChannelPage() {
  const { channelId, workspaceId } = useParams<{ channelId: string; workspaceId: string }>()
  const navigate = useNavigate()
  const { currentChannel, selectChannel, isLoading, error } = useChannelStore()
  
  const { messages, fetchMessages, nextCursors, isLoading: messagesLoading } = useMessageStore()
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  
  useEffect(() => {
    if (channelId) {
      selectChannel(channelId).catch(() => {})
      fetchMessages(channelId, 'channel')
      joinRoom(channelId, undefined)
      
      return () => {
        leaveRoom(channelId, undefined)
      }
    }
  }, [channelId, selectChannel, fetchMessages])

  if (isLoading && !currentChannel) {
    return <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-900 text-slate-500">Loading channel...</div>
  }

  if (error || !currentChannel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-900 p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Channel not found</h2>
        <p className="text-slate-500 mb-4">{error || 'This channel does not exist or you do not have access.'}</p>
        <button
          onClick={() => navigate(`/workspace/${workspaceId}`)}
          className="rounded bg-violet-600 px-4 py-2 text-white font-medium hover:bg-violet-500"
        >
          Return to Workspace
        </button>
      </div>
    )
  }



  const channelMessages = channelId ? messages[channelId] || [] : []
  const hasMore = channelId ? !!nextCursors[channelId] : false

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex flex-col flex-1 bg-white dark:bg-slate-900 overflow-hidden min-w-0">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4">
          <div className="flex items-center gap-2">
            <span className="text-xl text-slate-400">{currentChannel.isPrivate ? '🔒' : '#'}</span>
            <h1 className="font-bold text-slate-900 dark:text-white">{currentChannel.name}</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            {channelId && <HuddleButton targetType="channel" targetId={channelId} />}
            <button 
              onClick={() => navigate(`/workspace/${workspaceId}/channel/${channelId}/members`)}
              className="hover:text-slate-900 dark:hover:text-white"
            >
              {currentChannel._count?.members || 0} members
            </button>
            <button 
              onClick={() => navigate(`/workspace/${workspaceId}/channel/${channelId}/settings`)}
              className="hover:text-slate-900 dark:hover:text-white"
            >
              Settings
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <MessageList 
          messages={channelMessages}
          isLoading={messagesLoading}
          hasMore={hasMore}
          onLoadMore={() => {
            if (channelId && nextCursors[channelId]) {
              fetchMessages(channelId, 'channel', nextCursors[channelId]!)
            }
          }}
          roomId={channelId!}
          onOpenThread={setActiveThreadId}
        />

        {/* Input Area */}
        <MessageInput channelId={channelId} />
      </div>

      {activeThreadId && (
        <ThreadPanel 
          messageId={activeThreadId} 
          onClose={() => setActiveThreadId(null)} 
        />
      )}
    </div>
  )
}
