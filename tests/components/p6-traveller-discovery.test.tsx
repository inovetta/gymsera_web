// Phase 7 P6 on gymsera.com.
// BUG-26: /discovery/cities now lists only cities with a live gym, so the owner registration
// form reads every active city from GET /cities (a first host in a new city can still register).
// BUG-27 / NEW-145: a listing card shows "New" without approved reviews (not "0.0" and stars),
// the real review count, and the price the API sends (minPrice) in the listing's currency.
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const api = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/lib/api/client', () => ({ default: { get: api.get, post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/gym-owner/register',
}))
vi.mock('next/image', () => ({ default: (p: any) => <img alt={p.alt} src={p.src} /> }))
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }), toast: vi.fn() }))
vi.mock('@/lib/api/tenants', () => ({ tenantsApi: {} }))
vi.mock('@/lib/api/billing-plans', () => ({
  billingPlansApi: {
    getPlans: vi.fn().mockResolvedValue({ data: { plans: [] } }),
    getBankInstructions: vi.fn().mockResolvedValue({ data: {} }),
  },
}))
vi.mock('@/lib/api/packages', () => ({ packagesApi: { getPackages: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('@/lib/api/auth', () => ({ authApi: { refresh: vi.fn().mockRejectedValue(new Error('x')) } }))
vi.mock('@/stores/auth.store', () => {
  const state = { user: { id: 'u1' }, refreshToken: null, setAuth: vi.fn() }
  const store: any = (selector?: any) => (selector ? selector(state) : state)
  store.getState = () => state
  return { useAuthStore: store }
})
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'u1' }, isAuthenticated: true, isLoading: false, setAuth: vi.fn() }),
}))
vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
}))
vi.mock('@/components/features/location-picker', () => ({ LocationPicker: () => null }))

import { GymOwnerRegister } from '@/components/features/gym-owner-register'
import { GymCard } from '@/components/features/gym-card'
import { discoveryApi } from '@/lib/api/discovery'

const respond = (routes: Record<string, unknown>) =>
  api.get.mockImplementation(async (url: string) => {
    if (!(url in routes)) throw new Error(`unexpected GET ${url}`)
    return { data: { success: true, data: routes[url] } }
  })

// P9b (NEW-192): the registration city is now searched on our /places API (as the app, P3), which
// upserts any real city; BUG-26's guard stays: a city with no live gym can still be chosen, so the
// traveller list of live cities is never what registration reads.
describe('BUG-26: owner registration can choose a city with no live gym', () => {
  it('finds the city through /places, never the traveller list of live cities', async () => {
    respond({
      '/places/autocomplete': { suggestions: [{ placeId: 'city-newtown', primaryText: 'Newtown', secondaryText: 'Pakistan' }] },
      '/places/details/city-newtown': { placeId: 'city-newtown', formattedAddress: 'Newtown', latitude: 30, longitude: 70, city: { id: 9, name: 'Newtown' }, area: null },
      '/discovery/cities': { cities: [] },
    })
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <GymOwnerRegister />
      </QueryClientProvider>
    )
    const city = await screen.findByLabelText('City')
    fireEvent.focus(city)
    fireEvent.change(city, { target: { value: 'New' } })
    fireEvent.click(await screen.findByRole('button', { name: /Newtown/ }))
    await waitFor(() => expect((city as HTMLInputElement).value).toBe('Newtown'))
    expect(api.get).not.toHaveBeenCalledWith('/discovery/cities')
    expect(api.get).not.toHaveBeenCalledWith('/discovery/cities', expect.anything())
  })
})

describe('BUG-27 / NEW-145: listing card', () => {
  const cards = async (gyms: object[]) => {
    respond({ '/discovery/gyms': { gyms } })
    const res = await discoveryApi.getGyms()
    return res.data.gyms
  }
  const base = { tenantId: 't', status: 'ACTIVE', genderType: 'MIXED' }

  it('no approved review: "New", no "0.0"', async () => {
    const [gym] = await cards([{ ...base, id: 'a', title: 'heist', averageRating: 0, reviewCount: 0, minPrice: 2500, currency: 'PKR' }])
    render(<GymCard gym={gym} />)
    expect(screen.getByText('New')).toBeInTheDocument()
    expect(screen.queryByText('0.0')).not.toBeInTheDocument()
    expect(screen.getByText(/2,500/)).toBeInTheDocument()
  })

  it('approved reviews: value and count; price in the listing currency', async () => {
    const [gym] = await cards([{ ...base, id: 'b', title: 'king · iron', averageRating: 4.5, reviewCount: 3, minPrice: 40, currency: 'USD' }])
    render(<GymCard gym={gym} />)
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText('(3)')).toBeInTheDocument()
    expect(screen.getByText(/US\$\s?40|USD\s?40/)).toBeInTheDocument()
  })
})
