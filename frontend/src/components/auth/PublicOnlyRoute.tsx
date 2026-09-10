import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-200">
        Checking your session…
      </main>
    )
  }

  return isAuthenticated ? <Navigate to="/workspace" replace /> : <Outlet />
}
