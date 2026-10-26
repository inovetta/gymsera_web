import type { QueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Empties the React Query cache when the signed-in person goes away or changes
 * (NEW-110). Logout here is a client-side navigation, so without this the cache
 * (profile, subscriptions, bookings) outlives the session and the next person on
 * the same tab sees it until it refetches. Every logout path goes through the
 * auth store, so this one subscription covers them all.
 *
 * @returns unsubscribe
 */
export function clearQueryCacheOnSignOut(queryClient: QueryClient): () => void {
  return useAuthStore.subscribe((state, prev) => {
    const signedOut = prev.isAuthenticated && !state.isAuthenticated
    const switched = !!prev.user && !!state.user && prev.user.id !== state.user.id
    if (signedOut || switched) queryClient.clear()
  })
}
