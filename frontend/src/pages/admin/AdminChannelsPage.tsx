import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../../services/api'
import { Hash, Lock, Edit2, Trash2, Plus } from 'lucide-react'

interface Channel {
  id: string
  name: string
  description?: string | null
  isPrivate: boolean
  createdAt: string
  memberCount?: number
}

export function AdminChannelsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()

  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Edit channel modal state
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // Delete channel modal state
  const [deletingChannel, setDeletingChannel] = useState<Channel | null>(null)

  const fetchChannels = async () => {
    try {
      setLoading(true)
      const res = await api.get<{ success: boolean; channels: Channel[] }>(`/workspaces/${workspaceId}/channels`)
      if (res.data.success) {
        setChannels(res.data.channels)
      }
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to fetch channels')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (workspaceId) {
      fetchChannels()
    }
  }, [workspaceId])

  const openEditModal = (channel: Channel) => {
    setEditingChannel(channel)
    setEditName(channel.name)
    setEditDescription(channel.description || '')
  }

  const handleUpdateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingChannel) return
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await api.patch<{ success: boolean; channel: Channel }>(
        `/channels/${editingChannel.id}`,
        { name: editName, description: editDescription }
      )
      if (res.data.success) {
        setChannels(prev => prev.map(c => (c.id === editingChannel.id ? { ...c, name: editName, description: editDescription } : c)))
        setSuccessMsg(`Updated #${editName} channel`)
        setEditingChannel(null)
      }
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to update channel')
    }
  }

  const handleDeleteChannel = async () => {
    if (!deletingChannel) return
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await api.delete<{ success: boolean }>(`/channels/${deletingChannel.id}`)
      if (res.data.success) {
        setChannels(prev => prev.filter(c => c.id !== deletingChannel.id))
        setSuccessMsg(`Deleted channel #${deletingChannel.name}`)
        setDeletingChannel(null)
      }
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete channel')
      setDeletingChannel(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Workspace Channels</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage channel settings, privacy, and structure ({channels.length} channels).
          </p>
        </div>
        <button
          onClick={() => navigate(`/workspace/${workspaceId}/channel/new`)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-colors"
        >
          <Plus size={16} /> New Channel
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-sm">
          {successMsg}
        </div>
      )}

      {/* Channels Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-xs font-semibold uppercase text-slate-400">
              <th className="py-3.5 px-4">Channel</th>
              <th className="py-3.5 px-4">Description</th>
              <th className="py-3.5 px-4">Privacy</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {channels.map(channel => (
              <tr key={channel.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2.5">
                    {channel.isPrivate ? (
                      <Lock size={18} className="text-amber-400" />
                    ) : (
                      <Hash size={18} className="text-violet-400" />
                    )}
                    <span className="font-semibold text-white">#{channel.name}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-400 text-xs max-w-xs truncate">
                  {channel.description || <span className="italic text-slate-600">No description</span>}
                </td>
                <td className="py-3.5 px-4">
                  {channel.isPrivate ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      Private
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      Public
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(channel)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      title="Edit Channel"
                    >
                      <Edit2 size={16} />
                    </button>
                    {channel.name !== 'general' && (
                      <button
                        onClick={() => setDeletingChannel(channel)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                        title="Delete Channel"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Channel Modal */}
      {editingChannel && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdateChannel} className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Edit Channel #{editingChannel.name}</h3>
            
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Channel Name</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
              <textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingChannel(null)}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Channel Modal */}
      {deletingChannel && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Delete Channel #{deletingChannel.name}?</h3>
            <p className="text-sm text-slate-300">
              Are you sure you want to delete this channel? All messages and attachments inside will be permanently deleted.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingChannel(null)}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChannel}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
              >
                Delete Channel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
