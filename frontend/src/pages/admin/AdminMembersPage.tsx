import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '../../services/api'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useAuthStore } from '../../store/authStore'
import { Shield, ShieldAlert, User, Trash2, AlertTriangle } from 'lucide-react'

interface Member {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  status?: string
}

export function AdminMembersPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { currentWorkspace, selectWorkspace } = useWorkspaceStore()
  const { user: currentUser } = useAuthStore()

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Ownership transfer confirmation modal
  const [transferTarget, setTransferTarget] = useState<Member | null>(null)
  
  // Member removal confirmation modal
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null)

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const res = await api.get<{ success: boolean; members: Member[] }>(`/workspaces/${workspaceId}/members`)
      if (res.data.success) {
        setMembers(res.data.members)
      }
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to fetch members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (workspaceId) {
      fetchMembers()
    }
  }, [workspaceId])

  const handleRoleChange = async (member: Member, newRole: 'OWNER' | 'ADMIN' | 'MEMBER') => {
    setError(null)
    setSuccessMsg(null)

    if (newRole === 'OWNER') {
      setTransferTarget(member)
      return
    }

    try {
      const res = await api.patch<{ success: boolean; member: Member }>(
        `/workspaces/${workspaceId}/members/${member.id}/role`,
        { role: newRole }
      )
      if (res.data.success) {
        setMembers(prev => prev.map(m => (m.id === member.id ? { ...m, role: newRole } : m)))
        setSuccessMsg(`Updated ${member.name}'s role to ${newRole}`)
      }
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to update member role')
    }
  }

  const confirmTransferOwnership = async () => {
    if (!transferTarget || !workspaceId) return
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await api.patch<{ success: boolean; member: Member }>(
        `/workspaces/${workspaceId}/members/${transferTarget.id}/role`,
        { role: 'OWNER' }
      )
      if (res.data.success) {
        setMembers(prev =>
          prev.map(m => {
            if (m.id === transferTarget.id) return { ...m, role: 'OWNER' }
            if (m.id === currentUser?.id) return { ...m, role: 'ADMIN' }
            return m
          })
        )
        if (currentWorkspace?.id === workspaceId) {
          selectWorkspace(workspaceId)
        }
        setSuccessMsg(`Transferred workspace ownership to ${transferTarget.name}`)
        setTransferTarget(null)
      }
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to transfer ownership')
      setTransferTarget(null)
    }
  }

  const handleRemoveMember = async () => {
    if (!removeTarget || !workspaceId) return
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await api.delete<{ success: boolean }>(`/workspaces/${workspaceId}/members/${removeTarget.id}`)
      if (res.data.success) {
        setMembers(prev => prev.filter(m => m.id !== removeTarget.id))
        setSuccessMsg(`Removed ${removeTarget.name} from workspace`)
        setRemoveTarget(null)
      }
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove member')
      setRemoveTarget(null)
    }
  }

  const isOwner = currentWorkspace?.role === 'OWNER'

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Workspace Members</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage member roles, permissions, and workspace access ({members.length} members).
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

      {/* Members Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-xs font-semibold uppercase text-slate-400">
              <th className="py-3.5 px-4">Member</th>
              <th className="py-3.5 px-4">Email</th>
              <th className="py-3.5 px-4">Role</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {members.map(member => {
              const isSelf = member.id === currentUser?.id
              const isTargetOwner = member.role === 'OWNER'

              return (
                <tr key={member.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-violet-900/60 border border-violet-700/50 flex items-center justify-center font-bold text-violet-200">
                        {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-white flex items-center gap-1.5">
                          {member.name}
                          {isSelf && <span className="text-xs px-1.5 py-0.5 rounded bg-violet-600/30 text-violet-300 border border-violet-500/30 font-normal">You</span>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">{member.email}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      {member.role === 'OWNER' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          <ShieldAlert size={14} /> Owner
                        </span>
                      )}
                      {member.role === 'ADMIN' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/30">
                          <Shield size={14} /> Admin
                        </span>
                      )}
                      {member.role === 'MEMBER' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          <User size={14} /> Member
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {/* Role Selector */}
                      {!isSelf && !isTargetOwner && (isOwner || currentWorkspace?.role === 'ADMIN') ? (
                        <select
                          value={member.role}
                          onChange={e => handleRoleChange(member, e.target.value as 'OWNER' | 'ADMIN' | 'MEMBER')}
                          className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        >
                          <option value="MEMBER">Member</option>
                          <option value="ADMIN">Admin</option>
                          {isOwner && <option value="OWNER">Transfer Ownership</option>}
                        </select>
                      ) : null}

                      {/* Remove Member Button */}
                      {!isSelf && !isTargetOwner && (isOwner || (currentWorkspace?.role === 'ADMIN' && member.role === 'MEMBER')) && (
                        <button
                          onClick={() => setRemoveTarget(member)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                          title="Remove from workspace"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Ownership Transfer Modal */}
      {transferTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-white">Transfer Workspace Ownership?</h3>
            </div>
            <p className="text-sm text-slate-300">
              Are you sure you want to transfer primary ownership to <strong className="text-white">{transferTarget.name}</strong>?
            </p>
            <p className="text-xs text-amber-300 bg-amber-950/40 p-3 rounded-lg border border-amber-800/40">
              ⚠️ You will be demoted to <strong>Admin</strong> status and lose primary ownership rights.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setTransferTarget(null)}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmTransferOwnership}
                className="px-4 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Modal */}
      {removeTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Remove Member</h3>
            <p className="text-sm text-slate-300">
              Are you sure you want to remove <strong className="text-white">{removeTarget.name}</strong> ({removeTarget.email}) from this workspace? They will lose access to all channels and messages.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRemoveTarget(null)}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveMember}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
              >
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
