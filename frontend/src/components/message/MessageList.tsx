import { useEffect, useRef } from 'react'
import { MessageItem } from './MessageItem'
import type { Message } from '../../store/messageStore'
import { useSocketStore, getSocket } from '../../services/socket'

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
  roomId: string
  onOpenThread?: (messageId: string) => void
}

const EMPTY_ARRAY: any[] = []

export function MessageList({ messages, isLoading, hasMore, onLoadMore, roomId, onOpenThread }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingUsers = useSocketStore(state => state.typingUsers[roomId] || EMPTY_ARRAY)

  // Basic auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Emit read receipt when messages are rendered
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1]
      const socket = getSocket()
      if (socket) {
        socket.emit('message:read', {
          channelId: latestMessage.channelId,
          conversationId: latestMessage.conversationId,
          messageId: latestMessage.id
        })
      }
    }
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {hasMore && (
        <div className="flex justify-center py-4">
          <button 
            onClick={onLoadMore}
            disabled={isLoading}
            className="text-sm text-violet-600 hover:underline disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load older messages'}
          </button>
        </div>
      )}
      
      <div className="flex-1" />
      
      <div className="flex flex-col justify-end">
        {messages.map(msg => (
          <MessageItem key={msg.id} message={msg} onOpenThread={onOpenThread} />
        ))}
      </div>

      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-xs text-slate-500 italic">
          {typingUsers.length === 1 
            ? `${typingUsers[0].userName || 'Someone'} is typing...`
            : `${typingUsers.length} people are typing...`}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
