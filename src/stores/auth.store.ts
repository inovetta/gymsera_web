import { create } from 'zustand'
import { User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  setUser: (user: User) => void
  logout: () => void
  hydrate: () => void
}

// Read localStorage synchronously so the store is ready before the first
// client render — no useEffect delay, no loading-spinner flicker.
function readFromStorage() {
  if (typeof window === 'undefined') {
    return { user: null, accessToken: null, refreshToken: null, isAuthenticated: false }
  }
  const accessToken = localStorage.getItem('gymsera_access_token')
  const refreshToken = localStorage.getItem('gymsera_refresh_token')
  const userStr = localStorage.getItem('gymsera_user')
  const user = userStr ? (JSON.parse(userStr) as User) : null
  const isAuthenticated = !!accessToken && !!user
  if (!isAuthenticated) {
    document.cookie = 'gymsera_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  }
  return { user, accessToken, refreshToken, isAuthenticated }
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...readFromStorage(),
  // isLoading stays true only during SSR; on the client we resolved it above.
  isLoading: typeof window === 'undefined',

  // Still expose hydrate() so AuthProvider / any consumer can re-sync if needed.
  hydrate: () => {
    if (typeof window === 'undefined') return
    const accessToken = localStorage.getItem('gymsera_access_token')
    const refreshToken = localStorage.getItem('gymsera_refresh_token')
    const userStr = localStorage.getItem('gymsera_user')
    const user = userStr ? JSON.parse(userStr) : null
    const isAuthenticated = !!accessToken && !!user
    if (!isAuthenticated) {
      document.cookie = 'gymsera_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
    set({ accessToken, refreshToken, user, isAuthenticated, isLoading: false })
  },

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('gymsera_access_token', accessToken)
    localStorage.setItem('gymsera_refresh_token', refreshToken)
    localStorage.setItem('gymsera_user', JSON.stringify(user))
    document.cookie = `gymsera_session=1; path=/; max-age=${30 * 24 * 3600}; SameSite=Lax`
    set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false })
  },

  setUser: (user) => {
    localStorage.setItem('gymsera_user', JSON.stringify(user))
    set({ user })
  },

  logout: () => {
    localStorage.removeItem('gymsera_access_token')
    localStorage.removeItem('gymsera_refresh_token')
    localStorage.removeItem('gymsera_user')
    document.cookie = 'gymsera_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
  },
}))

