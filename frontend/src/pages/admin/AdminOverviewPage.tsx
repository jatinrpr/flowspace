import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, ApiError } from '../../services/api'
import { Users, Hash, Mail, ArrowRight, Activity, Settings } from 'lucide-react'

interface OverviewData {
  totalMembers: number
  totalChannels: number
  pendingInvitations: number
  recentAuditLogs: Array<{
    id: string
    action: string
    targetType: string
    targetId: string | null
    createdAt: string
    actor: {
      id: string
      name: string
      email: string
      avatarUrl?: string
    } | null
    metadata?: Record<string, unknown>
  }>
}

export function AdminOverviewPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOverview() {
      try {
        setLoading(true)
        const res = await api.get<{ success: boolean; totalMembers: number; totalChannels: number; pendingInvitations: number; recentAuditLogs: OverviewData['recentAuditLogs'] }>(
          `/workspaces/${workspaceId}/admin/overview`
        )
        if (res.data.success) {
          setData({
            totalMembers: res.data.totalMembers,
            totalChannels: res.data.totalChannels,
            pendingInvitations: res.data.pendingInvitations,
            recentAuditLogs: res.data.recentAuditLogs,
          })
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof ApiError ? err.message : (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load workspace admin overview'
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    }
    if (workspaceId) {
      fetchOverview()
    }
  }, [workspaceId])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-red-950/40 border border-red-800/50 p-4 text-red-300">
        {error || 'Could not load workspace stats'}
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Overview of workspace activity, users, and security logs.</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm font-medium text-slate-400">Total Members</p>
            <p className="text-3xl font-extrabold text-white mt-1">{data.totalMembers}</p>
          </div>
          <div className="p-3 bg-violet-600/20 text-violet-400 rounded-lg">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm font-medium text-slate-400">Total Channels</p>
            <p className="text-3xl font-extrabold text-white mt-1">{data.totalChannels}</p>
          </div>
          <div className="p-3 bg-cyan-600/20 text-cyan-400 rounded-lg">
            <Hash size={24} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm font-medium text-slate-400">Pending Invitations</p>
            <p className="text-3xl font-extrabold text-white mt-1">{data.pendingInvitations}</p>
          </div>
          <div className="p-3 bg-amber-600/20 text-amber-400 rounded-lg">
            <Mail size={24} />
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Management</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to={`/workspace/${workspaceId}/admin/members`}
            className="group bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg p-4 transition-all"
          >
            <div className="flex items-center justify-between text-slate-300 group-hover:text-white mb-2">
              <Users size={20} className="text-violet-400" />
              <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="font-semibold text-white">Manage Members</p>
            <p className="text-xs text-slate-400 mt-1">Assign roles & permissions</p>
          </Link>

          <Link
            to={`/workspace/${workspaceId}/admin/channels`}
            className="group bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg p-4 transition-all"
          >
            <div className="flex items-center justify-between text-slate-300 group-hover:text-white mb-2">
              <Hash size={20} className="text-cyan-400" />
              <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="font-semibold text-white">Manage Channels</p>
            <p className="text-xs text-slate-400 mt-1">Rename or remove channels</p>
          </Link>

          <Link
            to={`/workspace/${workspaceId}/admin/invitations`}
            className="group bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg p-4 transition-all"
          >
            <div className="flex items-center justify-between text-slate-300 group-hover:text-white mb-2">
              <Mail size={20} className="text-amber-400" />
              <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="font-semibold text-white">Invitations</p>
            <p className="text-xs text-slate-400 mt-1">Create or revoke invite links</p>
          </Link>

          <Link
            to={`/workspace/${workspaceId}/admin/settings`}
            className="group bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg p-4 transition-all"
          >
            <div className="flex items-center justify-between text-slate-300 group-hover:text-white mb-2">
              <Settings size={20} className="text-emerald-400" />
              <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="font-semibold text-white">Settings</p>
            <p className="text-xs text-slate-400 mt-1">Workspace details & configuration</p>
          </Link>
        </div>
      </div>

      {/* Recent Audit Activity */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-violet-400" />
            <h3 className="font-semibold text-white">Recent Security Audit Logs</h3>
          </div>
          <Link
            to={`/workspace/${workspaceId}/admin/audit-logs`}
            className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {data.recentAuditLogs.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">No recent security events logged.</div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {data.recentAuditLogs.map(log => (
              <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300 border border-slate-700">
                    {log.actor?.name ? log.actor.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <p className="text-sm text-slate-200">
                      <span className="font-semibold text-white">{log.actor?.name || 'System'}</span> performed{' '}
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-slate-800 text-violet-300 border border-slate-700">
                        {log.action}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Target: {log.targetType} {log.targetId ? `(${log.targetId})` : ''}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
