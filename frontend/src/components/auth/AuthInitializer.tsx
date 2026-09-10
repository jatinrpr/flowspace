import { useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'

export function AuthInitializer() {
  const { initialize, isAuthenticated } = useAuthStore()

  useEffect(() => {
    void initialize()
  }, [initialize])

  useEffect(() => {
    if (isAuthenticated) {
      import('../../services/socket').then(m => m.initializeSocket())
    } else {
      import('../../services/socket').then(m => m.disconnectSocket())
    }
  }, [isAuthenticated])

  return null
}
