import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useConversationStore } from '../../store/conversationStore'
import { useAuthStore } from '../../store/authStore'
import { useMessageStore } from '../../store/messageStore'
import { MessageList } from '../../components/message/MessageList'
import { MessageInput } from '../../components/message/MessageInput'
import { ThreadPanel } from '../../components/message/ThreadPanel'
import { joinRoom, leaveRoom, useSocketStore } from '../../services/socket'
import { HuddleButton } from '../../components/huddle/HuddleButton'

export function DirectMessagePage() {
  const { conversationId, workspaceId } = useParams<{ conversationId: string; workspaceId: string }>()
  const navigate = useNavigate()
  const { currentConversation, selectConversation, isLoading, error } = useConversationStore()
  const { user: currentUser } = useAuthStore()

  const { messages, fetchMessages, nextCursors, isLoading: messagesLoading } = useMessageStore()
  const { presence } = useSocketStore()
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)

  useEffect(() => {
    if (conversationId) {
      selectConversation(conversationId).catch(() => {})
      fetchMessages(conversationId, 'conversation')
      joinRoom(undefined, conversationId)

      return () => {
        leaveRoom(undefined, conversationId)
      }
    }
  }, [conversationId, selectConversation, fetchMessages])

  if (isLoading && !currentConversation) {
    return <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-900 text-slate-500">Loading conversation...</div>
  }

  if (error || !currentConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-900 p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Conversation not found</h2>
        <p className="text-slate-500 mb-4">{error || 'This conversation does not exist or you do not have access.'}</p>
        <button
          onClick={() => navigate(`/workspace/${workspaceId}`)}
          className="rounded bg-violet-600 px-4 py-2 text-white font-medium hover:bg-violet-500"
        >
          Return to Workspace
        </button>
      </div>
    )
  }

  let label = currentConversation.name
  if (currentConversation.type === 'DIRECT' && currentUser) {
    const other = currentConversation.members?.find(m => m.userId !== currentUser.id)
    label = other?.user?.name || 'Unknown'
  } else if (!label) {
    label = currentConversation.members?.map(m => m.user?.name).join(', ') || 'Unknown'
  }

  const otherUser = currentConversation.type === 'DIRECT' ? currentConversation.members?.find(m => m.userId !== currentUser?.id)?.user : null

  const isOnline = otherUser ? presence[otherUser.id] === 'ONLINE' : false


  const dmMessages = conversationId ? messages[conversationId] || [] : []
  const hasMore = conversationId ? !!nextCursors[conversationId] : false

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex flex-col flex-1 bg-white dark:bg-slate-900 overflow-hidden min-w-0">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded bg-violet-200 dark:bg-violet-900 overflow-hidden flex items-center justify-center text-violet-700 dark:text-violet-300 font-bold">
                {otherUser?.avatarUrl ? (
                  <img src={otherUser.avatarUrl} alt={otherUser.name} className="w-full h-full object-cover" />
                ) : (
                  label.charAt(0).toUpperCase()
                )}
              </div>
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
              )}
            </div>
            <div className="flex flex-col">
              <h1 className="font-bold text-slate-900 dark:text-white leading-none">{label}</h1>
              {currentConversation.type === 'DIRECT' && (
                <span className="text-xs text-slate-500">{isOnline ? 'Online' : 'Offline'}</span>
              )}
              {currentConversation.type === 'GROUP' && (
                <span className="text-xs text-slate-500">{currentConversation.members?.length || 0} members</span>
              )}
            </div>
          </div>
          {conversationId && <HuddleButton targetType="conversation" targetId={conversationId} />}
        </header>

        {/* Messages Area */}
        <MessageList 
          messages={dmMessages}
          isLoading={messagesLoading}
          hasMore={hasMore}
          onLoadMore={() => {
            if (conversationId && nextCursors[conversationId]) {
              fetchMessages(conversationId, 'conversation', nextCursors[conversationId]!)
            }
          }}
          roomId={conversationId!}
          onOpenThread={setActiveThreadId}
        />

        {/* Input Area */}
        <MessageInput conversationId={conversationId} />
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
