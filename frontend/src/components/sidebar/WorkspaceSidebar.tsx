import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SidebarSection } from './SidebarSection'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useChannelStore } from '../../store/channelStore'
import { useConversationStore } from '../../store/conversationStore'
import { useAuthStore } from '../../store/authStore'
import { usePresenceStore } from '../../store/presenceStore'
import { useNotificationStore } from '../../store/notificationStore'
import { useHuddleStore } from '../../store/huddleStore'
import { Bell } from 'lucide-react'

export function WorkspaceSidebar() {
  const navigate = useNavigate()
  const { workspaceId, channelId, conversationId } = useParams()
  const { workspaces, currentWorkspace } = useWorkspaceStore()
  const { channels, fetchChannels } = useChannelStore()
  const { conversations, fetchConversations } = useConversationStore()
  const { user: currentUser } = useAuthStore()
  const presence = usePresenceStore(state => state.userStatus)
  const huddleIndicators = useHuddleStore(state => state.huddleIndicators)
  
  const { unreadCount, togglePanel, fetchUnreadCount } = useNotificationStore()
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  useEffect(() => {
    if (workspaceId) {
      fetchChannels(workspaceId)
      fetchConversations(workspaceId)
    }
  }, [workspaceId, fetchChannels, fetchConversations])

  if (!currentWorkspace) return null

  const handleWorkspaceChange = (id: string) => {
    setShowDropdown(false)
    navigate(`/workspace/${id}`)
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-violet-950 pb-4 text-violet-50 md:w-72">
      
      {/* Workspace Header & Switcher */}
      <div className="relative border-b border-violet-800 px-4 py-4 flex items-center justify-between">
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex flex-1 items-center justify-between font-bold hover:bg-violet-900 rounded p-1 -ml-1 transition-colors truncate"
        >
          <span className="truncate">{currentWorkspace.name}</span>
          <span className="text-xs ml-2">▼</span>
        </button>

        <button 
          onClick={togglePanel}
          className="relative ml-2 p-2 hover:bg-violet-900 rounded text-violet-300 hover:text-violet-50 transition-colors"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {showDropdown && (
          <div className="absolute top-full left-4 right-4 z-50 mt-1 rounded shadow-lg bg-slate-800 text-slate-200 border border-slate-700 py-2">
            <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase">Switch Workspace</div>
            {workspaces.map(ws => (
              <button 
                key={ws.id} 
                onClick={() => handleWorkspaceChange(ws.id)}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-violet-600 hover:text-white ${ws.id === currentWorkspace.id ? 'bg-slate-700 font-bold' : ''}`}
              >
                {ws.name}
              </button>
            ))}
            <div className="my-1 border-t border-slate-600" />
            <button
              onClick={() => { setShowDropdown(false); navigate('/workspace/create') }}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-violet-600"
            >
              Create Workspace
            </button>
          </div>
        )}
      </div>

      <div className="px-3 mt-3 mb-1">
        <form onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          const q = fd.get('q') as string
          if (q.trim()) {
            navigate(`/workspace/${workspaceId}/search?q=${encodeURIComponent(q)}`)
          }
        }}>
          <input 
            type="text" 
            name="q"
            placeholder="Search messages..." 
            className="w-full bg-violet-900 border border-violet-800 rounded px-3 py-1 text-sm text-violet-50 placeholder-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </form>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 mt-4 space-y-4" aria-label="Workspace navigation">
        
        {/* Workspace Management Section */}
        <SidebarSection title="Workspace Management">
          {['OWNER', 'ADMIN'].includes(currentWorkspace.role) && (
            <button 
              className="w-full text-left flex items-center gap-2 px-2 py-1.5 hover:bg-violet-900 rounded font-semibold text-violet-200 bg-violet-900/50 mb-1"
              onClick={() => navigate(`/workspace/${currentWorkspace.id}/admin`)}
            >
              <span className="opacity-90">🛡️</span> Admin Center
            </button>
          )}
          <button 
            className="w-full text-left flex items-center gap-2 px-2 py-1 hover:bg-violet-900 rounded opacity-80 hover:opacity-100"
            onClick={() => navigate(`/workspace/${currentWorkspace.id}/invite`)}
          >
            <span className="opacity-70">+</span> Invite Members
          </button>
          <button 
            className="w-full text-left flex items-center gap-2 px-2 py-1 hover:bg-violet-900 rounded opacity-80 hover:opacity-100"
            onClick={() => navigate(`/workspace/${currentWorkspace.id}/members`)}
          >
            <span className="opacity-70">👥</span> Members
          </button>
          {['OWNER', 'ADMIN'].includes(currentWorkspace.role) && (
            <button 
              className="w-full text-left flex items-center gap-2 px-2 py-1 hover:bg-violet-900 rounded opacity-80 hover:opacity-100"
              onClick={() => navigate(`/workspace/${currentWorkspace.id}/settings`)}
            >
              <span className="opacity-70">⚙️</span> Settings
            </button>
          )}
        </SidebarSection>

        {/* Channels */}
        <div className="mt-4">
          <div className="flex items-center justify-between px-2 py-1 text-sm font-semibold text-violet-200">
            <span>Channels</span>
            <button 
              onClick={() => navigate(`/workspace/${currentWorkspace.id}/channel/new`)}
              className="hover:bg-violet-900 rounded px-1 opacity-70 hover:opacity-100"
              title="Create Channel"
            >
              +
            </button>
          </div>
          <div className="space-y-0.5">
            {channels.map((channel) => {
              const hInfo = huddleIndicators[channel.id]
              return (
                <button
                  key={channel.id}
                  onClick={() => navigate(`/workspace/${currentWorkspace.id}/channel/${channel.id}`)}
                  className={`w-full text-left flex items-center justify-between px-2 py-1 rounded opacity-80 hover:bg-violet-900 hover:opacity-100 ${channel.id === channelId ? 'bg-violet-800 opacity-100' : ''}`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="opacity-70 text-lg leading-none">{channel.isPrivate ? '🔒' : '#'}</span>
                    <span className="truncate">{channel.name}</span>
                  </div>
                  {hInfo && hInfo.participantCount > 0 && (
                    <span className="text-xs text-green-400 font-bold flex items-center gap-0.5 bg-green-950/60 px-1.5 py-0.5 rounded-full border border-green-700/50">
                      🎧 {hInfo.participantCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Direct Messages */}
        <div className="mt-4 pb-8">
          <div className="flex items-center justify-between px-2 py-1 text-sm font-semibold text-violet-200">
            <span>Direct Messages</span>
            <button 
              onClick={() => navigate(`/workspace/${currentWorkspace.id}/dm/new`)}
              className="hover:bg-violet-900 rounded px-1 opacity-70 hover:opacity-100"
              title="New Message"
            >
              +
            </button>
          </div>
          <div className="space-y-0.5">
            {conversations.map((conv) => {
              let label = conv.name
              if (conv.type === 'DIRECT' && currentUser) {
                const other = conv.members?.find(m => m.userId !== currentUser.id)
                label = other?.user?.name || 'Unknown'
              } else if (!label) {
                label = conv.members?.map(m => m.user?.name).join(', ') || 'Unknown'
              }
              
              const otherUser = conv.type === 'DIRECT' && currentUser ? conv.members?.find(m => m.userId !== currentUser.id) : null
              const status = otherUser ? presence[otherUser.userId] : 'OFFLINE'
              let dotColor = 'bg-gray-500'
              if (status === 'ONLINE') dotColor = 'bg-green-500'
              else if (status === 'AWAY') dotColor = 'bg-yellow-500'

              return (
                <button 
                  key={conv.id}
                  onClick={() => navigate(`/workspace/${workspaceId}/dm/${conv.id}`)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm truncate ${
                    conversationId === conv.id
                      ? 'bg-violet-700 text-white font-medium'
                      : 'text-violet-200 hover:bg-violet-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate relative pl-3">
                    {conv.type === 'GROUP' ? (
                      <span className="opacity-70">👥</span>
                    ) : (
                      <div className="relative flex items-center justify-center w-5 h-5">
                        {status !== 'OFFLINE' && status !== undefined && (
                          <div className={`absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${dotColor} border border-violet-900`} />
                        )}
                        <span className="opacity-70 ml-2">👤</span>
                      </div>
                    )}
                    <span className="truncate">{label}</span>
                  </div>
                  {(() => {
                    const hInfo = huddleIndicators[conv.id]
                    return hInfo && hInfo.participantCount > 0 ? (
                      <span className="text-xs text-green-400 font-bold flex items-center gap-0.5 bg-green-950/60 px-1.5 py-0.5 rounded-full border border-green-700/50">
                        🎧 {hInfo.participantCount}
                      </span>
                    ) : null
                  })()}
                </button>
              )
            })}
          </div>
        </div>
      </nav>
    </aside>
  )
}

