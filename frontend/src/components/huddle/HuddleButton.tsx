import { useState } from 'react'
import { Headphones } from 'lucide-react'
import { useHuddleStore } from '../../store/huddleStore'

interface HuddleButtonProps {
  targetType: 'channel' | 'conversation'
  targetId: string
}

export function HuddleButton({ targetType, targetId }: HuddleButtonProps) {
  const { joinHuddle, leaveHuddle, isJoined, isJoining, activeHuddle, huddleIndicators, error, clearError } = useHuddleStore()
  const [showError, setShowError] = useState(false)

  const indicator = huddleIndicators[targetId]
  const isInThisHuddle = isJoined && (activeHuddle?.channelId === targetId || activeHuddle?.conversationId === targetId)
  const isInOtherHuddle = isJoined && !isInThisHuddle

  const handleJoin = async () => {
    await joinHuddle(targetType, targetId)
    if (useHuddleStore.getState().error) {
      setShowError(true)
      setTimeout(() => {
        setShowError(false)
        clearError()
      }, 5000)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {showError && error && (
        <div className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded max-w-48 truncate">
          {error}
        </div>
      )}

      {isInThisHuddle ? (
        <button
          onClick={leaveHuddle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-red-600 transition-colors group"
        >
          <Headphones size={14} />
          <span className="group-hover:hidden">In huddle</span>
          <span className="hidden group-hover:inline">Leave</span>
        </button>
      ) : (
        <button
          onClick={handleJoin}
          disabled={isJoining || isInOtherHuddle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Headphones size={14} />
          {isJoining ? 'Joining...' : isInOtherHuddle ? 'In other huddle' : 'Join Huddle'}
          {indicator && indicator.participantCount > 0 && (
            <span className="bg-green-500 text-white rounded-full px-1.5 py-0.5 text-xs ml-1 font-bold">
              {indicator.participantCount}
            </span>
          )}
        </button>
      )}
    </div>
  )
}
