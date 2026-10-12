import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/gym-owner/register',
}))
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }), toast: vi.fn() }))

const mockTenants = vi.hoisted(() => ({
  registerTenant: vi.fn(),
  submitGymProfile: vi.fn(),
  selectPackage: vi.fn(),
  finalizeApplication: vi.fn(),
}))
vi.mock('@/lib/api/tenants', () => ({ tenantsApi: mockTenants }))
vi.mock('@/lib/api/billing-plans', () => ({
  billingPlansApi: {
    getPlans: vi.fn().mockResolvedValue({ data: { plans: [] } }),
    getBankInstructions: vi.fn().mockResolvedValue({ data: {} }),
    createCheckoutSession: vi.fn(),
  },
}))
vi.mock('@/lib/api/discovery', () => ({
  discoveryApi: { getCities: vi.fn().mockResolvedValue({ data: { cities: [{ id: 1, name: 'Lahore' }] } }) },
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
  LocationPicker: ({ onLocationChange, onAddressChange }: any) => (
    <button type="button" onClick={() => { onLocationChange({ lat: 31.5, lng: 74.3 }); onAddressChange('1 Main Rd') }}>
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

// Walks business -> gym profile -> plans step.
async function toPlansStep() {
  await user.type(screen.getByPlaceholderText('e.g. Fitness Plus Pvt Ltd'), 'Iron Paradise Ltd')
  await user.type(screen.getByPlaceholderText('info@yourcompany.com'), 'owner@example.com')
  await user.type(screen.getByPlaceholderText('+92 300 1234567'), '03001234567')
  await user.click(await screen.findByRole('button', { name: 'Lahore' }))
  await user.click(screen.getByRole('button', { name: /Continue to Gym Profile/ }))

  await user.type(await screen.findByPlaceholderText('e.g. Iron Paradise Gym'), 'Iron Paradise')
  await user.type(
    screen.getByPlaceholderText(/Describe your gym/),
    'A full service gym with strength and cardio floors.'
  )
  await user.click(screen.getByRole('button', { name: 'Mixed (Men & Women)' }))
  await user.click(screen.getByRole('button', { name: 'pin location' }))
  await user.click(screen.getByRole('button', { name: /Continue to Plans/ }))
  await screen.findByText('Membership Plans')
}

describe('web signup: membership plans step', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTenants.registerTenant.mockResolvedValue({ data: { tenant: { id: 't1', cityId: 1 } } })
    mockTenants.submitGymProfile.mockResolvedValue({ data: { tenant: { id: 't1' } } })
  })

  it('blocks Continue at 0 plans and sends nothing', async () => {
    renderWizard()
    await toPlansStep()

    const cont = screen.getByRole('button', { name: /Continue to Packages/ })
    expect(cont).toBeDisabled()
    fireEvent.click(cont)
    expect(mockTenants.submitGymProfile).not.toHaveBeenCalled()
  })

  it('sends the plans in mainBranchData.plans on gym-profile, in the mobile shape', async () => {
    renderWizard()
    await toPlansStep()

    await user.type(screen.getByPlaceholderText('e.g. Monthly Membership'), 'Monthly')
    await user.type(screen.getByPlaceholderText('5000'), '5000')
    await user.click(screen.getByRole('button', { name: /Add plan/ }))
    await user.click(screen.getByRole('button', { name: /Continue to Packages/ }))

    await waitFor(() => expect(mockTenants.submitGymProfile).toHaveBeenCalledTimes(1))
    const [tenantId, payload] = mockTenants.submitGymProfile.mock.calls[0]
    expect(tenantId).toBe('t1')
    expect(payload.gymName).toBe('Iron Paradise')
    // Identical to MOBILE_PLAN in gymsera_be's ux-24 web-shape contract test.
    expect(payload.mainBranchData.plans).toEqual([
      {
        name: 'Monthly', description: null, durationType: 'MONTHLY', durationValue: 1, price: 5000,
        joiningFee: 0, securityFee: 0, visitLimit: null, freezeLimitDays: 0,
        isTrial: false, isPublic: true, status: 'ACTIVE', isDeactivated: false,
      },
    ])
    expect(Object.keys(payload).sort()).toEqual(
      ['address', 'gymDescription', 'gymName', 'genderType', 'latitude', 'longitude', 'mainBranchData'].sort()
    )
    // Only gym-profile was called here; package selection is the next step.
    expect(mockTenants.selectPackage).not.toHaveBeenCalled()
  })
})
