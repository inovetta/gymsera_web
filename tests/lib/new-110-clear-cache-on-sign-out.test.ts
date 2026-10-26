// NEW-110 (part of BUG-16): signing out on the web is a client-side navigation (router.push('/')),
// so the React Query cache (profile, subscriptions, bookings) outlived the session and the next
// person to sign in on the same tab saw the previous person's data until it refetched.
import { QueryClient } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { clearQueryCacheOnSignOut } from '@/providers/clear-cache-on-sign-out'
import { useAuthStore } from '@/stores/auth.store'
import type { User } from '@/types'

const userA = { id: 'user-a', email: 'a@test.example', fullName: 'User A', role: 'MEMBER' } as unknown as User
const userB = { id: 'user-b', email: 'b@test.example', fullName: 'User B', role: 'MEMBER' } as unknown as User

describe('NEW-110: the query cache does not outlive the signed-in person', () => {
  let queryClient: QueryClient
  let unsubscribe: () => void

  beforeEach(() => {
    localStorage.clear()
    useAuthStore.getState().setAuth(userA, 'access-a', 'refresh-a')
    queryClient = new QueryClient()
    unsubscribe = clearQueryCacheOnSignOut(queryClient)
    queryClient.setQueryData(['me'], { fullName: 'User A' })
    queryClient.setQueryData(['auth-verified-subscriptions'], { memberships: [{ gymName: "A's gym" }] })
  })

  afterEach(() => {
    unsubscribe()
    useAuthStore.getState().logout()
  })

  it('logout empties the cache', () => {
    useAuthStore.getState().logout()
    expect(queryClient.getQueryData(['me'])).toBeUndefined()
    expect(queryClient.getQueryData(['auth-verified-subscriptions'])).toBeUndefined()
  })

  it('signing in as someone else empties the cache', () => {
    useAuthStore.getState().setAuth(userB, 'access-b', 'refresh-b')
    expect(queryClient.getQueryData(['me'])).toBeUndefined()
  })

  it('a profile update of the same person keeps the cache', () => {
    useAuthStore.getState().setUser({ ...userA, fullName: 'User A renamed' } as User)
    expect(queryClient.getQueryData(['me'])).toEqual({ fullName: 'User A' })
  })
})

describe('NEW-110: the app Providers clear the cache on logout', () => {
  it('a query cached by user A is gone after logout', async () => {
    const { render } = await import('@testing-library/react')
    const { useQueryClient } = await import('@tanstack/react-query')
    const { createElement } = await import('react')
    const { Providers } = await import('@/providers')

    // next-themes reads matchMedia, which jsdom does not provide
    window.matchMedia ??= ((media: string) => ({
      matches: false, media, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia

    localStorage.clear()
    useAuthStore.getState().setAuth(userA, 'access-a', 'refresh-a')
    let client: QueryClient | undefined
    const Probe = () => {
      client = useQueryClient()
      return null
    }
    render(createElement(Providers, null, createElement(Probe)))
    client!.setQueryData(['me'], { fullName: 'User A' })

    useAuthStore.getState().logout()

    expect(client!.getQueryData(['me'])).toBeUndefined()
  })
})
