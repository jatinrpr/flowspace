import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useWorkspaceStore } from '../../store/workspaceStore'

export function JoinWorkspacePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { joinWorkspace, isLoading, error, clearError } = useWorkspaceStore()
  
  const [joinSuccess, setJoinSuccess] = useState(false)

  useEffect(() => {
    clearError()
  }, [clearError])

  const handleJoin = async () => {
    if (!token) return
    try {
      const workspace = await joinWorkspace(token)
      setJoinSuccess(true)
      setTimeout(() => {
        navigate(`/workspace/${workspace.id}`)
      }, 1500)
    } catch (err) {
      // Error handled by store
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
      <div className="w-full max-w-md rounded-lg bg-slate-800 p-8 shadow-xl text-center">
        <h1 className="mb-6 text-2xl font-bold">Join a workspace</h1>
        
        {error ? (
          <div className="mb-6 rounded bg-red-900/50 p-4 text-red-200">
            {error}
          </div>
        ) : joinSuccess ? (
          <div className="mb-6 rounded bg-green-900/50 p-4 text-green-200">
            Successfully joined! Redirecting...
          </div>
        ) : (
          <div className="mb-6 text-slate-300">
            You have been invited to join a workspace.
          </div>
        )}

        {!joinSuccess && (
          <button
            onClick={handleJoin}
            disabled={isLoading || !!error}
            className="w-full rounded bg-violet-600 px-4 py-2 text-sm font-medium hover:bg-violet-500 disabled:opacity-50"
          >
            {isLoading ? 'Joining...' : 'Join Workspace'}
          </button>
        )}
        
        <div className="mt-6">
          <button
            onClick={() => navigate('/workspace')}
            className="text-sm text-slate-400 hover:text-white"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
