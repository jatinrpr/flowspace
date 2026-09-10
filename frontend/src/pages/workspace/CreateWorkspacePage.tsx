import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspaceStore } from '../../store/workspaceStore'

export function CreateWorkspacePage() {
  const navigate = useNavigate()
  const { createWorkspace, isLoading, error, clearError } = useWorkspaceStore()
  const [name, setName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (!name.trim()) return

    try {
      const workspace = await createWorkspace(name)
      navigate(`/workspace/${workspace.id}`)
    } catch (err) {
      // Error is handled by store
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
      <div className="w-full max-w-md rounded-lg bg-slate-800 p-8 shadow-xl">
        <h1 className="mb-6 text-2xl font-bold">Create a workspace</h1>
        
        {error && (
          <div className="mb-4 rounded bg-red-900/50 p-3 text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Workspace name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={1}
              maxLength={100}
              className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="e.g. Acme Corp"
            />
          </div>
          
          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={() => navigate('/workspace')}
              className="text-sm text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="rounded bg-violet-600 px-4 py-2 text-sm font-medium hover:bg-violet-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
