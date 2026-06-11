import { useAuthStore } from '@/stores/auth.store'

export function useAuth() {
  const { user, isAuthenticated, isLoading, accessToken } = useAuthStore()

  const isMember = user?.role === 'MEMBER'
  const isGymHost = user?.role === 'GYM_HOST'
  const isAdmin = user?.role === 'PLATFORM_ADMIN'
  const isStaff = user?.role === 'BRANCH_MANAGER' || user?.role === 'TRAINER'

  return {
    user,
    isAuthenticated,
    isLoading,
    accessToken,
    isMember,
    isGymHost,
    isAdmin,
    isStaff,
  }
}
