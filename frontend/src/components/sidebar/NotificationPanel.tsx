import { useNotificationStore } from '../../store/notificationStore'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, CheckCircle2, MessageSquare, Bell, Hash, MessageCircle } from 'lucide-react'

export function NotificationPanel() {
  const { 
    isPanelOpen, togglePanel, notifications, unreadCount, 
    fetchNotifications, loadMore, hasMore, isLoading,
    markAsRead, markAllAsRead
  } = useNotificationStore()
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isPanelOpen && notifications.length === 0 && !isLoading) {
      fetchNotifications()
    }
  }, [isPanelOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const isBell = (e.target as HTMLElement).closest('button')?.querySelector('.lucide-bell')
        if (!isBell) togglePanel()
      }
    }
    if (isPanelOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isPanelOpen, togglePanel])

  if (!isPanelOpen) return null

  const getIcon = (type: string) => {
    switch (type) {
      case 'MENTION': return <span className="text-blue-500 font-bold">@</span>
      case 'DM': return <MessageSquare size={14} className="text-green-500" />
      case 'THREAD': return <MessageCircle size={14} className="text-yellow-500" />
      case 'CHANNEL': return <Hash size={14} className="text-purple-500" />
      default: return <Bell size={14} />
    }
  }

  return (
    <div 
      ref={panelRef}
      className="absolute top-16 left-64 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden flex flex-col text-gray-800"
      style={{ maxHeight: 'calc(100vh - 100px)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          Notifications {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>}
        </h3>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <CheckCircle2 size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
            <Bell size={24} className="opacity-20" />
            No notifications
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(n => (
              <div 
                key={n.id} 
                className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                onClick={() => {
                  if (!n.read) markAsRead(n.id)
                  
                  if (n.workspaceId) {
                    if (n.channelId) {
                      navigate(`/workspace/${n.workspaceId}/channel/${n.channelId}`)
                    } else if (n.conversationId) {
                      navigate(`/workspace/${n.workspaceId}/dm/${n.conversationId}`)
                    }
                  }
                  togglePanel()
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!n.read && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); markAsRead(n.id) }}
                      className="text-gray-300 hover:text-blue-500 p-1 rounded"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {hasMore && (
              <button 
                onClick={loadMore}
                disabled={isLoading}
                className="w-full py-3 text-sm text-blue-600 hover:bg-gray-50"
              >
                {isLoading ? 'Loading...' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
