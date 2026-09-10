import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../store/authStore'

describe('authStore Zustand State Tests', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  })

  it('should have initial unauthenticated state', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isLoading).toBe(false)
  })

  it('should update state on manual user set', () => {
    useAuthStore.setState({
      user: {
        id: 'usr_100',
        email: 'admin@slack.com',
        name: 'Admin User',
        avatarUrl: null,
        status: 'ACTIVE',
      },
      isAuthenticated: true,
    })

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user?.name).toBe('Admin User')
  })

  it('should reset user on logout state clear', () => {
    useAuthStore.setState({
      user: { id: '1', email: 'a@b.com', name: 'A', avatarUrl: null, status: 'ACTIVE' },
      isAuthenticated: true,
    })

    useAuthStore.setState({ user: null, isAuthenticated: false })

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })
})
