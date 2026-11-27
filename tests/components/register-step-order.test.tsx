import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { fakePlaces, pickPlace } from '../helpers/places'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const search = vi.hoisted(() => ({ value: '' }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(search.value),
  usePathname: () => '/gym-owner/register',
}))
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }), toast: vi.fn() }))

const mockOrganizations = vi.hoisted(() => ({
  register: vi.fn(),
  submitFirstBusiness: vi.fn(),
  uploadStagingImages: vi.fn(),
  replaceFirstBusinessImages: vi.fn(),
  selectPackage: vi.fn(),
  finalizeApplication: vi.fn(),
}))
vi.mock('@/lib/api/organizations', () => ({ organizationsApi: mockOrganizations }))
vi.mock('@/lib/api/billing-plans', () => ({
  billingPlansApi: {
    getPlans: vi.fn().mockResolvedValue({ data: { plans: [] } }),
    getBankInstructions: vi.fn().mockResolvedValue({ data: {} }),
    createCheckoutSession: vi.fn(),
  },
}))
// Phase 7 P9b (NEW-192): the registration city is picked through our /places API (helpers/places.ts).
vi.mock('@/lib/api/cities', () => ({
  citiesApi: { getAll: vi.fn().mockResolvedValue({ data: [] }) },
}))
vi.mock('@/lib/api/packages', () => ({
  packagesApi: { getPackages: vi.fn().mockResolvedValue({ data: [] }) },
}))
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
vi.mock('@/components/ui/select', async () => {
  const React = await import('react')
  const Ctx = React.createContext<(v: string) => void>(() => {})
  return {
    Select: ({ onValueChange, children }: any) => <Ctx.Provider value={onValueChange ?? (() => {})}>{children}</Ctx.Provider>,
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: () => null,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ value, children }: any) => {
      const set = React.useContext(Ctx)
      return <button type="button" onClick={() => set(value)}>{children}</button>
    },
  }
})
vi.mock('@/components/features/location-picker', () => ({
  LocationPicker: ({ onLocationChange, onAddressChange, onAreaChange }: any) => (
    <button type="button" onClick={() => { onLocationChange({ lat: 31.5, lng: 74.3 }); onAddressChange('1 Main Rd'); onAreaChange?.({ id: 42, name: 'Gulberg III' }) }}>
      pin location
    </button>
  ),
}))

import { GymOwnerRegister } from '@/components/features/gym-owner-register'

const click = (el: HTMLElement) => fireEvent.click(el)
const type = (el: HTMLElement, v: string) => fireEvent.change(el, { target: { value: v } })

const renderWizard = (props: { initialStep?: number } = {}) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <GymOwnerRegister {...props} />
    </QueryClientProvider>
  )

describe('web signup: wizard order (business, details, location, photos, plans, package, payment)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    search.value = ''
    mockOrganizations.register.mockResolvedValue({ data: { organization: { id: 't1', cityId: 1, organizationName: 'Iron Paradise Ltd' } } })
    mockOrganizations.uploadStagingImages.mockResolvedValue({
      data: { urls: [1, 2, 3, 4, 5].map((n) => `https://cdn.test/${n}.jpg`) },
    })
  })

  it('walks the screens in mobile order and sends no first-business until plans', async () => {
    renderWizard({ initialStep: 2 })

    // Organization → Business → Branch (enterprise D8): step 2 is the organization, its name private.
    expect(screen.getByRole('heading', { name: 'Your organization' })).toBeInTheDocument()
    expect(screen.getByText('Organization name')).toBeInTheDocument()
    expect(screen.getByText('Only you and GymsEra see this')).toBeInTheDocument()
    type(screen.getByPlaceholderText('e.g. Fitness Plus Pvt Ltd'), 'Iron Paradise Ltd')
    type(screen.getByPlaceholderText('info@yourcompany.com'), 'owner@example.com')
    type(screen.getByPlaceholderText('+92 300 1234567'), '03001234567')
    fakePlaces()
    await pickPlace('City', 'Lah', /Lahore/)
    click(screen.getByRole('button', { name: /Continue to Gym Profile/ }))

    // 1. details
    expect(await screen.findByRole('heading', { name: 'Your first business' })).toBeInTheDocument()
    type(screen.getByPlaceholderText('e.g. Iron Paradise Gym'), 'Iron Paradise')
    type(screen.getByPlaceholderText(/Describe your gym/), 'A full service gym with strength and cardio floors.')
    click(screen.getByRole('button', { name: 'Mixed (Men & Women)' }))
    click(screen.getByRole('button', { name: /Continue to Location/ }))

    // 2. location & branch — cannot continue without a pin
    expect(await screen.findByRole('heading', { name: 'Location & Branch' })).toBeInTheDocument()
    click(screen.getByRole('button', { name: /Continue to Photos/ }))
    expect(await screen.findByText('Please pin your gym location on the map.')).toBeInTheDocument()
    click(screen.getByRole('button', { name: 'pin location' }))
    // FirstBranch.phone is required by the API: no phone, no next step.
    click(screen.getByRole('button', { name: /Continue to Photos/ }))
    expect(await screen.findByText('Please add the branch phone number.')).toBeInTheDocument()
    type(screen.getByPlaceholderText('Branch phone number'), '0421234567')
    click(screen.getByRole('button', { name: /Continue to Photos/ }))

    // 3. photos — gated at 3 (FirstBranch needs at least 3 urls)
    expect(await screen.findByRole('heading', { name: 'Gym Photos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continue to Plans/ })).toBeDisabled()
    fireEvent.change(screen.getByTestId('photo-input'), {
      target: { files: [1, 2, 3, 4, 5].map((n) => new File(['x'], `${n}.jpg`, { type: 'image/jpeg' })) },
    })
    await waitFor(() => expect(screen.getByRole('button', { name: /Continue to Plans/ })).not.toBeDisabled())
    expect(mockOrganizations.uploadStagingImages).toHaveBeenCalledWith(expect.any(Array))
    click(screen.getByRole('button', { name: /Continue to Plans/ }))

    // 4. plans
    expect(await screen.findByRole('heading', { name: 'Membership Plans' })).toBeInTheDocument()
    expect(mockOrganizations.submitFirstBusiness).not.toHaveBeenCalled()

    // Back from plans returns to photos with the uploaded photos still there.
    click(screen.getByRole('button', { name: /Back/ }))
    expect(await screen.findByRole('heading', { name: 'Gym Photos' })).toBeInTheDocument()
    expect(screen.getAllByRole('img')).toHaveLength(5)
  })

  it('legacy ?step=3 lands on the first gym screen', async () => {
    search.value = 'step=3'
    renderWizard()
    expect(await screen.findByRole('heading', { name: 'Your first business' })).toBeInTheDocument()
  })

  it('legacy ?step= links keep their meaning (4 = package, 5 = payment)', async () => {
    search.value = 'step=4'
    renderWizard()
    expect(await screen.findByRole('heading', { name: 'Choose Your Package' })).toBeInTheDocument()
  })
})
