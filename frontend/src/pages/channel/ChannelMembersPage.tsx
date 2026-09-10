import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useChannelStore } from '../../store/channelStore'
import { useWorkspaceStore } from '../../store/workspaceStore'

export function ChannelMembersPage() {
  const { channelId, workspaceId } = useParams<{ channelId: string; workspaceId: string }>()
  const navigate = useNavigate()
  
  const { currentChannel, selectChannel, members, fetchChannelMembers, removeChannelMember, addChannelMember, isLoading } = useChannelStore()
  const { members: workspaceMembers, fetchMembers: fetchWorkspaceMembers } = useWorkspaceStore()
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (channelId && workspaceId) {
      selectChannel(channelId)
      fetchChannelMembers(channelId)
      fetchWorkspaceMembers()
    }
  }, [channelId, workspaceId])

  const handleRemove = async (userId: string) => {
    if (!channelId) return
    if (!confirm('Remove this user from the channel?')) return
    await removeChannelMember(channelId, userId)
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!channelId) return
    
    for (const userId of Array.from(selectedUsers)) {
      await addChannelMember(channelId, userId)
    }
    
    setShowAddModal(false)
    setSelectedUsers(new Set())
  }

  if (isLoading && !currentChannel) return <div className="p-8">Loading...</div>
  if (!currentChannel) return <div className="p-8">Channel not found</div>

  const nonMembers = workspaceMembers.filter(
    (wm) => !members.some((cm) => cm.id === wm.id)
  )

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 p-8 text-slate-900 dark:text-white">
      <div className="max-w-3xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/workspace/${workspaceId}/channel/${channelId}`)}
              className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              &larr; Back
            </button>
            <h1 className="text-3xl font-bold">
              {currentChannel.isPrivate ? '🔒' : '#'} {currentChannel.name} Members
            </h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded bg-violet-600 px-4 py-2 text-white font-medium hover:bg-violet-500"
          >
            Add Members
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-violet-200 dark:bg-violet-900 flex items-center justify-center text-violet-700 dark:text-violet-200 font-bold overflow-hidden">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                  ) : (
                    member.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-semibold">{member.name}</p>
                  <p className="text-sm text-slate-500">{member.email}</p>
                </div>
              </div>
              <button
                onClick={() => handleRemove(member.id)}
                className="text-sm text-red-600 dark:text-red-400 hover:underline font-medium"
              >
                Remove
              </button>
            </div>
          ))}
          {members.length === 0 && (
            <div className="p-8 text-center text-slate-500">No members found.</div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-slate-800 p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Add members to {currentChannel.name}</h2>
            
            <form onSubmit={handleAddSubmit}>
              <div className="max-h-60 overflow-y-auto mb-4 border border-slate-200 dark:border-slate-700 rounded divide-y divide-slate-100 dark:divide-slate-700/50">
                {nonMembers.map(wm => (
                  <label key={wm.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(wm.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedUsers)
                        if (e.target.checked) newSet.add(wm.id)
                        else newSet.delete(wm.id)
                        setSelectedUsers(newSet)
                      }}
                      className="rounded text-violet-600 focus:ring-violet-500"
                    />
                    <div>
                      <p className="font-medium">{wm.name}</p>
                      <p className="text-xs text-slate-500">{wm.email}</p>
                    </div>
                  </label>
                ))}
                {nonMembers.length === 0 && (
                  <div className="p-4 text-center text-sm text-slate-500">
                    All workspace members are already in this channel.
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedUsers.size === 0 || isLoading}
                  className="rounded bg-violet-600 px-4 py-2 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-50"
                >
                  {isLoading ? 'Adding...' : `Add ${selectedUsers.size} members`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
