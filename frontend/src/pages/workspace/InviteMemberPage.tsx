import { useState, useEffect } from 'react'
import { useWorkspaceStore } from '../../store/workspaceStore'

export function InviteMemberPage() {
  const { currentWorkspace, inviteMember, fetchInvitations, revokeInvitation, invitations, isLoading, error, clearError } = useWorkspaceStore()
  
  const [email, setEmail] = useState('')
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null)
  
  const isOwnerOrAdmin = currentWorkspace && ['OWNER', 'ADMIN'].includes(currentWorkspace.role)

  useEffect(() => {
    if (isOwnerOrAdmin) {
      fetchInvitations()
    }
  }, [isOwnerOrAdmin, fetchInvitations])

  if (!currentWorkspace || !isOwnerOrAdmin) {
    return (
      <div className="p-8 text-center text-slate-500">
        You do not have permission to invite members to this workspace.
      </div>
    )
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setLastInviteUrl(null)
    if (!email.trim()) return

    try {
      const invitation = await inviteMember(email)
      setLastInviteUrl(invitation.inviteUrl)
      setEmail('')
      await fetchInvitations()
    } catch (err) {
      // Error handled by store
    }
  }

  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (lastInviteUrl) {
      navigator.clipboard.writeText(lastInviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 p-8 text-slate-900 dark:text-white">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Invite people to {currentWorkspace.name}</h1>
        
        {error && (
          <div className="mb-6 rounded bg-red-100 dark:bg-red-900/50 p-4 text-red-600 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleInvite} className="mb-12 bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 disabled:opacity-50"
              placeholder="name@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="rounded bg-violet-600 px-4 py-2 text-white font-medium hover:bg-violet-500 disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Invite'}
          </button>
        </form>

        {lastInviteUrl && (
          <div className="mb-12 bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-900/50">
            <h3 className="text-green-800 dark:text-green-300 font-semibold mb-2">Invitation Created!</h3>
            <p className="text-sm text-green-700 dark:text-green-400 mb-4">
              For development purposes, here is the direct invitation link:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={lastInviteUrl}
                className="flex-1 rounded border border-green-300 dark:border-green-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
              <button
                onClick={handleCopy}
                className="rounded bg-green-600 px-3 py-2 text-white text-sm font-medium hover:bg-green-500 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold mb-4">Pending Invitations</h2>
        {invitations.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">No pending invitations.</p>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Expires</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-100 dark:hover:bg-slate-750">
                    <td className="px-6 py-4">{inv.email}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(inv.expiresAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => revokeInvitation(inv.id)}
                        disabled={isLoading}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
