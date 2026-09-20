import { create } from 'zustand'
import { apiRequest } from '../services/api'
import type { AuthUser } from '../types/auth'

interface UserResponse {
  success: true
  user: AuthUser
  accessToken?: string
}

interface AuthStore {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  signup: (input: {
    name: string
    email: string
    password: string
    confirmPassword: string
  }) => Promise<void>
  login: (input: { email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  fetchCurrentUser: () => Promise<AuthUser>
  refreshSession: () => Promise<void>
  initialize: () => Promise<void>
}

const setAuthenticated = (user: AuthUser) => ({
  user,
  isAuthenticated: true,
  isLoading: false,
})
const setUnauthenticated = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('flowspace_token')
  }
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signup: async (input) => {
    const response = await apiRequest<UserResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    if (response.accessToken && typeof window !== 'undefined') {
      localStorage.setItem('flowspace_token', response.accessToken)
    }
    set(setAuthenticated(response.user))
  },
  login: async (input) => {
    const response = await apiRequest<UserResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    if (response.accessToken && typeof window !== 'undefined') {
      localStorage.setItem('flowspace_token', response.accessToken)
    }
    set(setAuthenticated(response.user))
  },
  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } finally {
      set(setUnauthenticated())
    }
  },
  fetchCurrentUser: async () => {
    const response = await apiRequest<UserResponse>('/auth/me')
    set(setAuthenticated(response.user))
    return response.user
  },
  refreshSession: async () => {
    await apiRequest('/auth/refresh', { method: 'POST' })
  },
  initialize: async () => {
    if (!get().isLoading) return

    try {
      await get().fetchCurrentUser()
    } catch {
      try {
        await get().refreshSession()
        await get().fetchCurrentUser()
      } catch {
        set(setUnauthenticated)
      }
    }
  },
}))
