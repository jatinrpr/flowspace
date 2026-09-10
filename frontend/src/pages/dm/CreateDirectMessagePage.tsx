import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useConversationStore } from '../../store/conversationStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useAuthStore } from '../../store/authStore'

export function CreateDirectMessagePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()
  
  const { createDirectMessage, createGroupDM, isLoading, error, clearError } = useConversationStore()
  const { members: workspaceMembers, fetchMembers: fetchWorkspaceMembers } = useWorkspaceStore()
  const { user: currentUser } = useAuthStore()
  
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [groupName, setGroupName] = useState('')

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceMembers()
    }
  }, [workspaceId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceId || selectedUsers.size === 0) return
    clearError()
    
    try {
      const memberIds = Array.from(selectedUsers)
      
      if (memberIds.length === 1) {
        // Direct Message
        const conv = await createDirectMessage(workspaceId, memberIds)
        navigate(`/workspace/${workspaceId}/dm/${conv.id}`)
      } else {
        // Group DM
        const conv = await createGroupDM(workspaceId, memberIds, groupName.trim() || undefined)
        navigate(`/workspace/${workspaceId}/dm/${conv.id}`)
      }
    } catch (err) {
      // handled by store
    }
  }

  const otherMembers = workspaceMembers.filter(m => m.id !== currentUser?.id)

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 p-8 text-slate-900 dark:text-white">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">New Message</h1>
        
        {error && (
          <div className="mb-6 rounded bg-red-100 dark:bg-red-900/50 p-4 text-red-600 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          
          <div>
            <label className="block text-sm font-medium mb-3">Select Members</label>
            <div className="max-h-60 overflow-y-auto border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 divide-y divide-slate-100 dark:divide-slate-600/50">
              {otherMembers.map(wm => (
                <label key={wm.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-600/50 cursor-pointer">
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
                    <p className="text-xs text-slate-500 dark:text-slate-400">{wm.email}</p>
                  </div>
                </label>
              ))}
              {otherMembers.length === 0 && (
                <div className="p-4 text-sm text-slate-500">No other members in this workspace yet.</div>
              )}
            </div>
          </div>

          {selectedUsers.size > 1 && (
            <div>
              <label className="block text-sm font-medium mb-1">Group Name (optional)</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={80}
                className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
                placeholder="e.g. Project Alpha"
              />
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => navigate(`/workspace/${workspaceId}`)}
              className="px-4 py-2 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || selectedUsers.size === 0}
              className="rounded bg-violet-600 px-4 py-2 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : selectedUsers.size > 1 ? 'Start Group DM' : 'Start DM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
