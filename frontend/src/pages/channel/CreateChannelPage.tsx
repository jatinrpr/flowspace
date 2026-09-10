import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useChannelStore } from '../../store/channelStore'

export function CreateChannelPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()
  const { createChannel, isLoading, error, clearError } = useChannelStore()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceId || !name.trim()) return
    clearError()
    
    try {
      const channel = await createChannel(workspaceId, name, isPrivate, description || undefined)
      navigate(`/workspace/${workspaceId}/channel/${channel.id}`)
    } catch (err) {
      // handled by store
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 p-8 text-slate-900 dark:text-white">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create a channel</h1>
        
        {error && (
          <div className="mb-6 rounded bg-red-100 dark:bg-red-900/50 p-4 text-red-600 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div>
            <label className="block text-sm font-medium mb-1">Channel name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              required
              maxLength={80}
              className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
              placeholder="e.g. plan-budget"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={250}
              className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
            />
          </div>

          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
              />
              <span className="text-sm font-medium">Make private</span>
            </label>
            <p className="mt-1 text-xs text-slate-500 ml-7">
              {isPrivate ? 'Only invited members can view this channel.' : 'Anyone in your workspace can view this channel.'}
            </p>
          </div>

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
              disabled={isLoading || !name.trim()}
              className="rounded bg-violet-600 px-4 py-2 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
