import { useEffect, useState, useRef } from 'react'
import { apiRequest } from '../../services/api'
import { MessageItem } from './MessageItem'
import { MessageInput } from './MessageInput'
import type { Message } from '../../store/messageStore'
import { X, Loader2 } from 'lucide-react'


export function ThreadPanel({ messageId, onClose }: { messageId: string, onClose: () => void }) {
  const [replies, setReplies] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true
    setIsLoading(true)
    
    apiRequest<{ success: boolean, thread: { rootMessageId: string, replies: Message[] } }>(`/messages/${messageId}/thread`)
      .then(res => {
        if (mounted && res.success) {
          setReplies(res.thread.replies || [])
          // In a real app we'd fetch the root message here if we didn't get it from the state
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })
      
    return () => { mounted = false }
  }, [messageId])

  // Listen to new thread replies via socket
  useEffect(() => {
    // For this quick demo, we'll just refetch if we need to, or add a quick global listener.
    // Actually we can add an event listener to the socket directly since we export getSocket()
    
    // Fallback: poll every 10 seconds if we didn't attach the socket cleanly
    const interval = setInterval(() => {
      apiRequest<{ success: boolean, thread: { replies: Message[] } }>(`/messages/${messageId}/thread`)
        .then(res => {
          if (res.success) setReplies(res.thread.replies || [])
        })
    }, 10000)
    
    return () => clearInterval(interval)
  }, [messageId])

  return (
    <div className="w-80 md:w-96 flex flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xl z-20">
      <header className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        <h2 className="font-bold text-slate-900 dark:text-white">Thread</h2>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X size={20} />
        </button>
      </header>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 flex flex-col justify-end min-h-full">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {replies.length === 0 && (
                <div className="text-center text-slate-500 my-4 text-sm">No replies yet. Be the first!</div>
              )}
              {replies.map(reply => (
                <MessageItem key={reply.id} message={reply} />
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-900 z-10">
        <MessageInput threadMessageId={messageId} onThreadReplySent={() => {
          // just refetch quickly for simplicity if socket wasn't caught
          apiRequest<{ success: boolean, thread: { replies: Message[] } }>(`/messages/${messageId}/thread`)
            .then(res => {
              if (res.success) setReplies(res.thread.replies || [])
              setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
            })
        }} />
      </div>
    </div>
  )
}
