import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '../../services/api'
import { ShieldAlert, ChevronLeft, ChevronRight, Filter } from 'lucide-react'

interface AuditLog {
  id: string
  action: string
  targetType: string
  targetId: string | null
  metadata: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  actor: {
    id: string
    name: string
    email: string
    avatarUrl?: string
  } | null
}

interface AuditLogsResponse {
  success: boolean
  logs: AuditLog[]
  total: number
  page: number
  totalPages: number
}

const ACTION_OPTIONS = [
  'ALL',
  'USER_ROLE_CHANGED',
  'USER_REMOVED',
  'CHANNEL_CREATED',
  'CHANNEL_RENAMED',
  'CHANNEL_DELETED',
  'WORKSPACE_UPDATED',
  'INVITATION_CREATED',
  'INVITATION_REVOKED',
]

export function AdminAuditLogsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedAction, setSelectedAction] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (selectedAction !== 'ALL') {
        params.set('action', selectedAction)
      }

      const res = await api.get<AuditLogsResponse>(`/workspaces/${workspaceId}/audit-logs?${params.toString()}`)
      if (res.data.success) {
        setLogs(res.data.logs)
        setTotalPages(res.data.totalPages)
        setTotal(res.data.total)
      }
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to fetch audit logs')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, page, selectedAction])

  useEffect(() => {
    if (workspaceId) {
      fetchAuditLogs()
    }
  }, [workspaceId, fetchAuditLogs])

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="text-violet-400" size={26} /> Security Audit Logs
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Append-only security log tracking admin actions, role changes, and channel modifications ({total} events logged).
          </p>
        </div>

        {/* Filter dropdown */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
          <Filter size={16} className="text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Action:</span>
          <select
            value={selectedAction}
            onChange={e => {
              setSelectedAction(e.target.value)
              setPage(1)
            }}
            className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
          >
            {ACTION_OPTIONS.map(act => (
              <option key={act} value={act} className="bg-slate-900 text-white">
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-sm">
          No audit logs found for the selected filter.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-xs font-semibold uppercase text-slate-400">
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target</th>
                <th className="py-3.5 px-4">Details</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-violet-300">
                        {log.actor?.name ? log.actor.name.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-xs">{log.actor?.name || 'System'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{log.actor?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-violet-950/80 text-violet-300 border border-violet-800/60">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 text-xs font-mono">
                    {log.targetType} {log.targetId ? `(${log.targetId.substring(0, 8)}...)` : ''}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-xs font-mono max-w-xs truncate">
                    {log.metadata ? JSON.stringify(log.metadata) : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-xs font-mono">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-400 text-xs font-mono">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div>
                Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
