import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useChannelStore } from '../../store/channelStore'

export function ChannelSettingsPage() {
  const { channelId, workspaceId } = useParams<{ channelId: string; workspaceId: string }>()
  const navigate = useNavigate()
  const { currentChannel, selectChannel, updateChannel, deleteChannel, isLoading, error } = useChannelStore()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (channelId) {
      selectChannel(channelId).then(() => {
        const chan = useChannelStore.getState().currentChannel
        if (chan) {
          setName(chan.name)
          setDescription(chan.description || '')
        }
      })
    }
  }, [channelId, selectChannel])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!channelId) return
    try {
      await updateChannel(channelId, name, description)
    } catch (err) {
      // handled by store
    }
  }

  const handleDelete = async () => {
    if (!channelId || !workspaceId) return
    if (!confirm('Are you sure you want to delete this channel? This cannot be undone.')) return
    
    try {
      await deleteChannel(channelId)
      navigate(`/workspace/${workspaceId}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete channel')
    }
  }

  if (isLoading && !currentChannel) return <div className="p-8">Loading...</div>
  if (!currentChannel) return <div className="p-8">Channel not found</div>

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 p-8 text-slate-900 dark:text-white">
      <div className="max-w-2xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/workspace/${workspaceId}/channel/${channelId}`)}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            &larr; Back
          </button>
          <h1 className="text-3xl font-bold">Channel Settings</h1>
        </div>

        {error && (
          <div className="mb-6 rounded bg-red-100 dark:bg-red-900/50 p-4 text-red-600 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 mb-8">
          <h2 className="text-xl font-bold mb-4">General</h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Channel Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                required
                className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
                rows={3}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="rounded bg-violet-600 px-4 py-2 text-white font-medium hover:bg-violet-500 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Danger Zone</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
            Deleting a channel removes all of its messages and members. This action cannot be undone.
          </p>
          <button
            onClick={handleDelete}
            disabled={isLoading || currentChannel.name === 'general'}
            className="rounded bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-500 disabled:opacity-50"
          >
            Delete Channel
          </button>
          {currentChannel.name === 'general' && (
            <p className="text-red-500 text-xs mt-2">The #general channel cannot be deleted.</p>
          )}
        </div>

      </div>
    </div>
  )
}
