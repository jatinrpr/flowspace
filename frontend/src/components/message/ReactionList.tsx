import { useAuthStore } from '../../store/authStore'
import { apiRequest } from '../../services/api'
import type { Reaction } from '../../store/messageStore'
import EmojiPicker from 'emoji-picker-react'
import { useState, useRef, useEffect } from 'react'

export function ReactionList({ reactions, messageId }: { reactions: Reaction[], messageId: string }) {
  const { user } = useAuthStore()
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Group reactions by emoji
  const grouped = reactions.reduce((acc, curr) => {
    if (!acc[curr.emoji]) acc[curr.emoji] = { count: 0, users: [], hasReacted: false }
    acc[curr.emoji].count++
    acc[curr.emoji].users.push(curr.user?.name || 'Unknown')
    if (curr.userId === user?.id) {
      acc[curr.emoji].hasReacted = true
    }
    return acc
  }, {} as Record<string, { count: number, users: string[], hasReacted: boolean }>)

  const handleToggleReaction = async (emoji: string, hasReacted: boolean) => {
    try {
      if (hasReacted) {
        await apiRequest(`/messages/${messageId}/reactions/${emoji}`, { method: 'DELETE' })
      } else {
        await apiRequest(`/messages/${messageId}/reactions`, {
          method: 'POST',
          body: JSON.stringify({ emoji })
        })
      }
    } catch (error) {
      console.error('Failed to toggle reaction', error)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false)
      }
    }
    if (showPicker) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPicker])

  const entries = Object.entries(grouped)

  if (entries.length === 0 && !showPicker) return null

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {entries.map(([emoji, data]) => (
        <button
          key={emoji}
          onClick={() => handleToggleReaction(emoji, data.hasReacted)}
          title={data.users.join(', ')}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium border ${
            data.hasReacted 
              ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300' 
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          <span>{emoji}</span>
          <span>{data.count}</span>
        </button>
      ))}
      
      <div className="relative">
        <button 
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          title="Add reaction"
        >
          +
        </button>
        {showPicker && (
          <div ref={pickerRef} className="absolute z-50 mt-1 left-0 shadow-xl">
            <EmojiPicker 
              onEmojiClick={(e) => {
                handleToggleReaction(e.emoji, false)
                setShowPicker(false)
              }}
              width={280}
              height={350}
            />
          </div>
        )}
      </div>
    </div>
  )
}
