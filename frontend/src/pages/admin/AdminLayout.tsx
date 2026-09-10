import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link, Outlet, useLocation } from 'react-router-dom'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useAuthStore } from '../../store/authStore'
import { LayoutDashboard, Users, Hash, Mail, ShieldAlert, Settings, ArrowLeft } from 'lucide-react'

export function AdminLayout() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { currentWorkspace, workspaces } = useWorkspaceStore()
  const { user } = useAuthStore()

  const [checking, setChecking] = useState(true)

  const isAuthorized = currentWorkspace && (currentWorkspace.role === 'OWNER' || currentWorkspace.role === 'ADMIN')

  useEffect(() => {
    if (!currentWorkspace && workspaceId) {
      const ws = workspaces.find(w => w.id === workspaceId)
      if (ws && (ws.role === 'OWNER' || ws.role === 'ADMIN')) {
        setChecking(false)
        return
      }
    }
    if (currentWorkspace) {
      if (currentWorkspace.role !== 'OWNER' && currentWorkspace.role !== 'ADMIN') {
        navigate(`/workspace/${workspaceId}`, { replace: true })
      } else {
        setChecking(false)
      }
    }
  }, [currentWorkspace, workspaceId, workspaces, navigate])

  if (checking) {
    return <div className="flex h-screen items-center justify-center bg-slate-900 text-white">Loading Admin Panel...</div>
  }

  if (!isAuthorized) return null

  const navItems = [
    { path: `/workspace/${workspaceId}/admin`, label: 'Overview', icon: LayoutDashboard, exact: true },
    { path: `/workspace/${workspaceId}/admin/members`, label: 'Members', icon: Users },
    { path: `/workspace/${workspaceId}/admin/channels`, label: 'Channels', icon: Hash },
    { path: `/workspace/${workspaceId}/admin/invitations`, label: 'Invitations', icon: Mail },
    { path: `/workspace/${workspaceId}/admin/audit-logs`, label: 'Audit Logs', icon: ShieldAlert },
    { path: `/workspace/${workspaceId}/admin/settings`, label: 'Settings', icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg text-white truncate">{currentWorkspace?.name}</h2>
            <span className="text-xs text-violet-400 font-medium capitalize">Admin Center ({currentWorkspace?.role})</span>
          </div>
          <Link
            to={`/workspace/${workspaceId}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Back to Workspace"
          >
            <ArrowLeft size={18} />
          </Link>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon
            const active = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path)

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          Logged in as <span className="font-medium text-slate-300">{user?.name}</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
