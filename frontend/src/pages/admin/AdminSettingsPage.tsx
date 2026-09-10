import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../../services/api'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { Settings, Trash2, AlertOctagon } from 'lucide-react'

export function AdminSettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()
  const { currentWorkspace, updateWorkspace } = useWorkspaceStore()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Delete Workspace modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  useEffect(() => {
    if (currentWorkspace) {
      setName(currentWorkspace.name)
      setSlug(currentWorkspace.slug)
    }
  }, [currentWorkspace])

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceId) return
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      await updateWorkspace(name)
      setSuccessMsg('Workspace settings updated successfully')
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to update workspace settings')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWorkspace = async () => {
    if (!workspaceId || deleteConfirmText !== currentWorkspace?.name) return
    setError(null)
    setLoading(true)

    try {
      const res = await api.delete<{ success: boolean }>(`/workspaces/${workspaceId}`)
      if (res.data.success) {
        navigate('/workspace', { replace: true })
      }
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete workspace')
      setLoading(false)
    }
  }

  const isOwner = currentWorkspace?.role === 'OWNER'

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="text-violet-400" size={26} /> Workspace Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage general workspace identity, name, and administrative actions.
        </p>
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

      {/* General Settings Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-semibold text-white">General Information</h2>

        <form onSubmit={handleUpdateSettings} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Workspace Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Workspace Slug (Read-only)</label>
            <input
              type="text"
              disabled
              value={slug}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-400 font-mono"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading || name === currentWorkspace?.name}
              className="px-5 py-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      {isOwner && (
        <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertOctagon size={22} />
            <h2 className="text-lg font-bold text-red-300">Danger Zone</h2>
          </div>
          <p className="text-xs text-slate-400">
            Deleting this workspace will permanently destroy all channels, messages, direct messages, files, and member records. This action cannot be undone.
          </p>

          <div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
            >
              <Trash2 size={16} /> Delete Workspace
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Permanently Delete Workspace?</h3>
            <p className="text-sm text-slate-300">
              To confirm deletion of <strong className="text-white">{currentWorkspace?.name}</strong>, type the workspace name below:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder={currentWorkspace?.name}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-semibold focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                }}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={deleteConfirmText !== currentWorkspace?.name || loading}
                onClick={handleDeleteWorkspace}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-lg transition-colors"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
