import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { fakePlaces, pickPlace } from '../helpers/places'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/gym-owner/register',
}))
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }), toast: vi.fn() }))

const mockOrganizations = vi.hoisted(() => ({
  register: vi.fn(),
  submitFirstBusiness: vi.fn(),
  uploadFirstBusinessImages: vi.fn(),
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

// Radix Select and the Google map are not what is under test.
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
  LocationPicker: ({ onLocationChange, onAddressChange, onPlaceChange, onAreaChange }: any) => (
    <button type="button" onClick={() => { onLocationChange({ lat: 31.5, lng: 74.3 }); onAddressChange('1 Main Rd'); onPlaceChange?.('gp-1'); onAreaChange?.(42) }}>
      pin location
    </button>
  ),
}))

import { GymOwnerRegister } from '@/components/features/gym-owner-register'

// Minimal stand-in for user-event (not a dependency of this repo).
const user = {
  type: async (el: HTMLElement, text: string) => { fireEvent.change(el, { target: { value: text } }) },
  click: async (el: HTMLElement) => { fireEvent.click(el) },
}

const renderWizard = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <GymOwnerRegister initialStep={2} />
    </QueryClientProvider>
  )

const photoFile = (n: number) => new File(['x'], `p${n}.jpg`, { type: 'image/jpeg' })

// Walks business -> gym details -> location -> photos (5) -> plans step.
async function toPlansStep() {
  await user.type(screen.getByPlaceholderText('e.g. Fitness Plus Pvt Ltd'), 'Iron Paradise Ltd')
  await user.type(screen.getByPlaceholderText('info@yourcompany.com'), 'owner@example.com')
  await user.type(screen.getByPlaceholderText('+92 300 1234567'), '03001234567')
  fakePlaces()
  await pickPlace('City', 'Lah', /Lahore/)
  await user.click(screen.getByRole('button', { name: /Continue to Gym Profile/ }))

  await user.type(await screen.findByPlaceholderText('e.g. Iron Paradise Gym'), 'Iron Paradise')
  await user.type(
    screen.getByPlaceholderText(/Describe your gym/),
    'A full service gym with strength and cardio floors.'
  )
  await user.click(screen.getByRole('button', { name: 'Mixed (Men & Women)' }))
  await user.click(screen.getByRole('button', { name: /Continue to Location/ }))
  await user.click(await screen.findByRole('button', { name: 'pin location' }))
  await user.click(screen.getByRole('button', { name: /Continue to Photos/ }))
  const files = [1, 2, 3, 4, 5].map(photoFile)
  fireEvent.change(await screen.findByTestId('photo-input'), { target: { files } })
  const cont = await screen.findByRole('button', { name: /Continue to Plans/ })
  await waitFor(() => expect(cont).not.toBeDisabled())
  await user.click(cont)
  await screen.findByText('Membership Plans')
}

describe('web signup: membership plans step', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOrganizations.register.mockResolvedValue({ data: { organization: { id: 't1', cityId: 1 } } })
    mockOrganizations.submitFirstBusiness.mockResolvedValue({ data: { organization: { id: 't1' } } })
    mockOrganizations.uploadFirstBusinessImages.mockResolvedValue({
      data: { imagesJson: [1, 2, 3, 4, 5].map((n) => `https://cdn.test/${n}.jpg`) },
    })
  })

  it('blocks Continue at 0 plans and sends nothing', async () => {
    renderWizard()
    await toPlansStep()

    const cont = screen.getByRole('button', { name: /Continue to Packages/ })
    expect(cont).toBeDisabled()
    fireEvent.click(cont)
    expect(mockOrganizations.submitFirstBusiness).not.toHaveBeenCalled()
  })

  it('sends one firstBranch (A3 J10) on first-business, plans as packages in the mobile shape', async () => {
    renderWizard()
    await toPlansStep()

    await user.type(screen.getByPlaceholderText('e.g. Monthly Membership'), 'Monthly')
    await user.type(screen.getByPlaceholderText('5000'), '5000')
    await user.click(screen.getByRole('button', { name: /Add plan/ }))
    await user.click(screen.getByRole('button', { name: /Continue to Packages/ }))

    await waitFor(() => expect(mockOrganizations.submitFirstBusiness).toHaveBeenCalledTimes(1))
    const [organizationId, payload] = mockOrganizations.submitFirstBusiness.mock.calls[0]
    expect(organizationId).toBe('t1')
    // Contract v2: step 2 registers the ORGANIZATION (private name), then step 3 the first business.
    const registered = mockOrganizations.register.mock.calls[0][0]
    expect(registered).toMatchObject({ organizationName: 'Iron Paradise Ltd', cityId: expect.any(Number) })
    expect(registered).not.toHaveProperty('businessName')
    expect(screen.queryByText('Only you and GymsEra see this')).toBeNull() // shown on step 2 only
    expect(payload.firstBusinessName).toBe('Iron Paradise')
    // Identical to MOBILE_PLAN in gymsera_be's ux-24 web-shape contract test.
    expect(payload.firstBranch.packages).toEqual([
      {
        name: 'Monthly', description: null, durationType: 'MONTHLY', durationValue: 1, price: 5000,
        joiningFee: 0, securityFee: 0, visitLimit: null, freezeLimitDays: 0,
        isTrial: false, isPublic: true, status: 'ACTIVE', isDeactivated: false,
      },
    ])
    // A3 J10: the body is organization/business keys plus ONE firstBranch; no flat address, no firstBranchDraft.
    expect(Object.keys(payload).sort()).toEqual(['firstBranch', 'firstBusinessDescription', 'firstBusinessName', 'genderType'])
    expect(payload).not.toHaveProperty('firstBranchDraft')
    const fb = payload.firstBranch
    expect(fb).toMatchObject({
      branchName: 'Iron Paradise', cityId: 1, areaId: 42, address: '1 Main Rd', latitude: 31.5, longitude: 74.3,
      googlePlaceId: 'gp-1',
    })
    expect(fb).not.toHaveProperty('areaRequestId')
    expect(fb).not.toHaveProperty('name')
    expect(fb).not.toHaveProperty('placeId')
    expect(fb).not.toHaveProperty('plans')
    expect(fb.imagesJson).toHaveLength(5)
    expect(fb.imagesJson.length).toBeGreaterThanOrEqual(3)
    // Only first-business was called here; package selection is the next step.
    expect(mockOrganizations.selectPackage).not.toHaveBeenCalled()
  })
})
