import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspaceStore } from '../../store/workspaceStore'

export function WorkspaceSettingsPage() {
  const { currentWorkspace, updateWorkspace, deleteWorkspace, isLoading, error, clearError } = useWorkspaceStore()
  const navigate = useNavigate()
  
  const [name, setName] = useState(currentWorkspace?.name || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!currentWorkspace) return null

  const isOwnerOrAdmin = ['OWNER', 'ADMIN'].includes(currentWorkspace.role)
  const isOwner = currentWorkspace.role === 'OWNER'

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (!name.trim()) return
    await updateWorkspace(name)
  }

  const handleDelete = async () => {
    await deleteWorkspace()
    navigate('/workspace', { replace: true })
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 p-8 text-slate-900 dark:text-white">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Workspace Settings</h1>
        
        {error && (
          <div className="mb-6 rounded bg-red-100 dark:bg-red-900/50 p-4 text-red-600 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Update Form */}
        <section className="mb-12 bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold mb-4">General Settings</h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Workspace Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isOwnerOrAdmin || isLoading}
                className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 disabled:opacity-50"
              />
            </div>
            {isOwnerOrAdmin && (
              <button
                type="submit"
                disabled={isLoading || name === currentWorkspace.name}
                className="rounded bg-violet-600 px-4 py-2 text-white font-medium hover:bg-violet-500 disabled:opacity-50"
              >
                Save Changes
              </button>
            )}
          </form>
        </section>

        {/* Danger Zone */}
        {isOwner && (
          <section className="bg-red-50 dark:bg-red-950/20 p-6 rounded-lg border border-red-200 dark:border-red-900/50">
            <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-4">Danger Zone</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Deleting a workspace is irreversible. All channels, messages, and files will be permanently deleted.
            </p>
            
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-500"
              >
                Delete Workspace
              </button>
            ) : (
              <div className="flex items-center gap-4 bg-red-100 dark:bg-red-900/40 p-4 rounded">
                <span className="text-sm font-medium text-red-800 dark:text-red-200">
                  Are you sure you want to delete this workspace?
                </span>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="rounded bg-red-600 px-3 py-1 text-white text-sm font-medium hover:bg-red-500 disabled:opacity-50"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded border border-red-600 px-3 py-1 text-red-700 dark:text-red-400 text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50"
                >
                  Cancel
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
