import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fakePlaces, pickPlace } from '../helpers/places'

/**
 * Phase 7 P9b item 8, NEW-192 (P2). Before: the website registration's business step picked the
 * city from a list of our own cities (gym-owner-register.tsx Select over GET /cities), while the app
 * (P3) and the rest of the website (P9, location picker) search Google Places through our API
 * (R-76): GET /places/autocomplete?kind=city, then GET /places/details, which upserts the city and
 * answers our city id. The browser never calls Google; the web key only draws maps.
 */
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/gym-owner/register',
}))
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }), toast: vi.fn() }))
const mockTenants = vi.hoisted(() => ({
  registerTenant: vi.fn(), submitGymProfile: vi.fn(), uploadOnboardingImages: vi.fn(),
  replaceOnboardingImages: vi.fn(), selectPackage: vi.fn(), finalizeApplication: vi.fn(),
}))
vi.mock('@/lib/api/tenants', () => ({ tenantsApi: mockTenants }))
vi.mock('@/lib/api/billing-plans', () => ({
  billingPlansApi: { getPlans: vi.fn().mockResolvedValue({ data: { plans: [] } }), getBankInstructions: vi.fn().mockResolvedValue({ data: {} }), createCheckoutSession: vi.fn() },
}))
const mockCities = vi.hoisted(() => ({ getAll: vi.fn().mockResolvedValue({ data: [{ id: 1, name: 'Karachi' }] }) }))
vi.mock('@/lib/api/cities', () => ({ citiesApi: mockCities }))
vi.mock('@/lib/api/packages', () => ({ packagesApi: { getPackages: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('@/lib/api/auth', () => ({ authApi: { refresh: vi.fn().mockRejectedValue(new Error('x')) } }))
vi.mock('@/stores/auth.store', () => {
  const state = { user: { id: 'u1' }, refreshToken: null, setAuth: vi.fn() }
  const store: any = (selector?: any) => (selector ? selector(state) : state)
  store.getState = () => state
  return { useAuthStore: store }
})
vi.mock('@/hooks/use-auth', () => ({ useAuth: () => ({ user: { id: 'u1' }, isAuthenticated: true, isLoading: false, setAuth: vi.fn() }) }))

import { GymOwnerRegister } from '@/components/features/gym-owner-register'

const renderWizard = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <GymOwnerRegister initialStep={2} />
    </QueryClientProvider>
  )

const fillBusiness = () => {
  fireEvent.change(screen.getByPlaceholderText('e.g. Fitness Plus Pvt Ltd'), { target: { value: 'Iron Paradise Ltd' } })
  fireEvent.change(screen.getByPlaceholderText('info@yourcompany.com'), { target: { value: 'owner@example.com' } })
  fireEvent.change(screen.getByPlaceholderText('+92 300 1234567'), { target: { value: '03001234567' } })
}

let places: ReturnType<typeof fakePlaces>
beforeEach(() => {
  vi.clearAllMocks()
  places = fakePlaces()
  mockTenants.registerTenant.mockResolvedValue({ data: { tenant: { id: 't1', cityId: 7 } } })
})
afterEach(() => vi.restoreAllMocks())

describe('NEW-192: the registration city comes from Places through our API', () => {
  it('searches cities on /places and registers with the city id the API answers', async () => {
    renderWizard()
    fillBusiness()
    await pickPlace('City', 'Lah', /Lahore/)
    expect(places.autocomplete).toHaveBeenCalledWith(expect.objectContaining({ kind: 'city', input: 'Lah' }))
    expect(places.details).toHaveBeenCalledWith('city-lahore', expect.objectContaining({ kind: 'city' }))
    fireEvent.click(screen.getByRole('button', { name: /Continue to Gym Profile/ }))
    await waitFor(() => expect(mockTenants.registerTenant).toHaveBeenCalledTimes(1))
    expect(mockTenants.registerTenant.mock.calls[0][0]).toMatchObject({ cityId: 7 })
  })

  it('does not read our own city list', async () => {
    renderWizard()
    await screen.findByLabelText('City')
    expect(mockCities.getAll).not.toHaveBeenCalled()
  })

  it('typed text that was not picked is not a city', async () => {
    renderWizard()
    fillBusiness()
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Somewhere' } })
    fireEvent.click(screen.getByRole('button', { name: /Continue to Gym Profile/ }))
    expect(await screen.findByText(/pick your city from the list/i)).toBeInTheDocument()
    expect(mockTenants.registerTenant).not.toHaveBeenCalled()
  })
})
