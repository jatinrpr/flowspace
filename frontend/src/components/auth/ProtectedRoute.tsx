import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-200">
        Checking your session…
      </main>
    )
  }

  return isAuthenticated ? <Outlet /> : <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
}
