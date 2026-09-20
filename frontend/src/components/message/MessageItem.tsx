import { useState } from 'react'
import type { Message } from '../../store/messageStore'
import { useAuthStore } from '../../store/authStore'
import { editSocketMessage, deleteSocketMessage } from '../../services/socket'
import { ReactionList } from './ReactionList'
import { FileAttachmentList } from './FileAttachmentList'
import { FormattedContent } from './FormattedContent'
import { VoiceMessage } from './VoiceMessage'
import { getMediaUrl } from '../../utils/mediaUrl'
import { MessageSquare } from 'lucide-react'

interface MessageItemProps {
  message: Message
  onOpenThread?: (messageId: string) => void
}

export function MessageItem({ message, onOpenThread }: MessageItemProps) {
  const { user } = useAuthStore()
  const isOwner = user?.id === message.senderId
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveEdit = () => {
    const trimmed = editContent.trim()
    if (!trimmed || trimmed === message.content) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    editSocketMessage({ messageId: message.id, content: trimmed }, (res) => {
      setIsSaving(false)
      if (res.success) {
        setIsEditing(false)
      } else {
        alert(res.error || 'Failed to edit message')
      }
    })
  }

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this message?')) return
    deleteSocketMessage({ messageId: message.id }, (res) => {
      if (!res.success) {
        alert(res.error || 'Failed to delete message')
      }
    })
  }

  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const isEdited = message.updatedAt !== message.createdAt

  if (message.deletedAt) {
    return (
      <div className="flex gap-3 py-2 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
        <div className="w-9 h-9 rounded bg-slate-200 dark:bg-slate-700 shrink-0 opacity-50" />
        <div className="flex-1">
          <span className="text-slate-400 italic text-sm">This message was deleted.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 py-2 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 group relative">
      <div className="w-9 h-9 rounded bg-violet-200 dark:bg-violet-900 shrink-0 overflow-hidden flex items-center justify-center text-violet-700 dark:text-violet-300 font-bold">
        {message.sender.avatarUrl ? (
          <img src={message.sender.avatarUrl} alt={message.sender.name} className="w-full h-full object-cover" />
        ) : (
          message.sender.name.charAt(0).toUpperCase()
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-slate-900 dark:text-slate-100">{message.sender.name}</span>
          <span className="text-xs text-slate-500">{time}</span>
        </div>
        
        {isEditing ? (
          <div className="mt-1">
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 rounded p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              rows={2}
            />
            <div className="flex gap-2 mt-2">
              <button 
                onClick={handleSaveEdit} 
                disabled={isSaving}
                className="bg-violet-600 text-white px-3 py-1 rounded text-sm"
              >
                Save
              </button>
              <button 
                onClick={() => setIsEditing(false)} 
                disabled={isSaving}
                className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-1 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-0.5 text-slate-800 dark:text-slate-300">
            {message.type === 'VOICE' && message.files?.[0] ? (
              <VoiceMessage 
                url={getMediaUrl(message.files[0].url)} 
                initialDuration={message.content && !isNaN(Number(message.content)) && Number(message.content) > 0 ? Number(message.content) : undefined}
              />
            ) : (
              <FormattedContent content={message.content} mentions={message.mentions} />
            )}
            {isEdited && <span className="text-xs text-slate-400 ml-2">(edited)</span>}
          </div>
        )}
        
        {message.type !== 'VOICE' && <FileAttachmentList files={message.files || []} />}
        <ReactionList reactions={message.reactions || []} messageId={message.id} />
        
        {message.thread?._count?.replies ? (
          <div className="mt-1">
            <button 
              onClick={() => onOpenThread?.(message.id)}
              className="text-sm font-medium text-violet-600 hover:underline flex items-center gap-1"
            >
              <MessageSquare size={14} />
              {message.thread._count.replies} {message.thread._count.replies === 1 ? 'reply' : 'replies'}
            </button>
          </div>
        ) : null}
      </div>

      {!isEditing && (
        <div className="absolute top-2 right-4 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm p-1 z-10">
          <button 
            onClick={() => onOpenThread?.(message.id)}
            className="p-1.5 text-slate-400 hover:text-violet-500 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
            title="Reply in thread"
          >
            <MessageSquare size={16} />
          </button>
          
          {isOwner && (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                title="Edit"
              >
                ✏️
              </button>
              <button 
                onClick={handleDelete}
                className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                title="Delete"
              >
                🗑️
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
