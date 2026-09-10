import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '../../services/api'
import { Mail, Plus, Trash2, Copy, Check } from 'lucide-react'

interface Invitation {
  id: string
  email: string
  expiresAt: string
  createdAt: string
}

export function AdminInvitationsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()

  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Create Invitation Modal State
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchInvitations = async () => {
    try {
      setLoading(true)
      const res = await api.get<{ success: boolean; invitations: Invitation[] }>(`/workspaces/${workspaceId}/invitations`)
      if (res.data.success) {
        setInvitations(res.data.invitations)
      }
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to fetch invitations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (workspaceId) {
      fetchInvitations()
    }
  }, [workspaceId])

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    setError(null)

    try {
      const res = await api.post<{ success: boolean; invitation: Invitation & { inviteUrl?: string } }>(
        `/workspaces/${workspaceId}/invitations`,
        { email: inviteEmail }
      )
      if (res.data.success) {
        setInvitations(prev => [res.data.invitation, ...prev])
        if (res.data.invitation.inviteUrl) {
          setGeneratedUrl(res.data.invitation.inviteUrl)
        } else {
          setSuccessMsg(`Invitation sent to ${inviteEmail}`)
          setShowInviteModal(false)
          setInviteEmail('')
        }
      }
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to send invitation')
    }
  }

  const handleRevokeInvite = async (invitationId: string, email: string) => {
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await api.delete<{ success: boolean }>(`/workspaces/${workspaceId}/invitations/${invitationId}`)
      if (res.data.success) {
        setInvitations(prev => prev.filter(i => i.id !== invitationId))
        setSuccessMsg(`Revoked invitation for ${email}`)
      }
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to revoke invitation')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
          <h1 className="text-2xl font-bold text-white">Pending Invitations</h1>
          <p className="text-slate-400 text-sm mt-1">
            Track and invite new users to join this workspace ({invitations.length} active).
          </p>
        </div>
        <button
          onClick={() => {
            setShowInviteModal(true)
            setGeneratedUrl(null)
            setInviteEmail('')
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-colors"
        >
          <Plus size={16} /> Invite Member
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

      {/* Invitations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {invitations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <Mail size={32} className="mx-auto mb-2 opacity-50 text-slate-400" />
            No pending invitations. Click "Invite Member" to generate invitation links.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-xs font-semibold uppercase text-slate-400">
                <th className="py-3.5 px-4">Invited Email</th>
                <th className="py-3.5 px-4">Created At</th>
                <th className="py-3.5 px-4">Expires At</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {invitations.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-white font-mono text-xs">{inv.email}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-xs">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-xs">
                    {new Date(inv.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleRevokeInvite(inv.id, inv.email)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                      title="Revoke Invitation"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Invite a New Member</h3>

            {!generatedUrl ? (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors"
                  >
                    Generate Invite Link
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-300">
                  Invitation created for <strong className="text-white">{inviteEmail}</strong>! Share this link to allow them to join:
                </p>

                <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <input
                    type="text"
                    readOnly
                    value={generatedUrl}
                    className="bg-transparent text-xs font-mono text-violet-300 flex-1 outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedUrl)}
                    className="p-1.5 rounded bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                    title="Copy Link"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setShowInviteModal(false)
                      setGeneratedUrl(null)
                      setInviteEmail('')
                    }}
                    className="px-4 py-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
