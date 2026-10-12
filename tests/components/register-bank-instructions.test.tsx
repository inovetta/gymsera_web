import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/gym-owner/register',
}))

const toast = vi.hoisted(() => vi.fn())
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }), toast }))

const mockBillingPlansApi = vi.hoisted(() => ({
  getPlans: vi.fn().mockResolvedValue({ data: { plans: [] } }),
  getBankInstructions: vi.fn(),
  createCheckoutSession: vi.fn(),
}))
vi.mock('@/lib/api/billing-plans', () => ({ billingPlansApi: mockBillingPlansApi }))

vi.mock('@/lib/api/discovery', () => ({
  discoveryApi: {
    getCities: vi.fn().mockResolvedValue({ data: { cities: [] } }),
  },
}))

vi.mock('@/lib/api/packages', () => ({
  packagesApi: {
    getPackages: vi.fn().mockResolvedValue({
      data: [{ id: 'pkg-1', name: 'Starter', price: 5000, billingCycle: 'MONTHLY', maxBranches: 1, status: 'ACTIVE' }],
    }),
  },
}))

vi.mock('@/lib/api/tenants', () => ({
  tenantsApi: {
    registerTenant: vi.fn(),
    submitGymProfile: vi.fn(),
    selectPackage: vi.fn(),
    finalizeApplication: vi.fn(),
  },
}))

vi.mock('@/stores/auth.store', () => {
  const store = (selector?: any) => (selector ? selector({ setAuth: vi.fn(), refreshToken: 'tok' }) : { setAuth: vi.fn(), refreshToken: 'tok' })
  store.getState = () => ({ user: { id: 'u1', email: 'owner@example.com' }, refreshToken: 'tok', setAuth: vi.fn() })
  return { useAuthStore: store }
})

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'owner@example.com' },
    isAuthenticated: true,
    isLoading: false,
    setAuth: vi.fn(),
  }),
}))

import { GymOwnerRegister } from '@/components/features/gym-owner-register'
import GymOwnerRegisterPage from '@/app/gym-owner/register/page'

const dummyPackage = {
  id: 'pkg-1',
  name: 'Starter Plan',
  price: 5000,
  billingCycle: 'MONTHLY' as const,
  maxBranches: 1,
  maxMembers: 100,
  status: 'ACTIVE' as const,
}

const renderComponent = (initialStep = 5) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <GymOwnerRegister initialStep={initialStep} initialPackage={dummyPackage as any} />
    </QueryClientProvider>
  )
}

describe('UX-07 & UX-15 on Gym Owner Register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders UX-07 14-day grace period copy on Pay After Approval option', async () => {
    mockBillingPlansApi.getBankInstructions.mockResolvedValue({
      data: { bankName: null, accountTitle: null, accountNumber: null, iban: null, swiftCode: null, currency: 'PKR', instructions: null }
    })
    renderComponent()

    // Since the mocked user is authenticated, initial step is business/gym/payment
    // Verify UX-07 text presence
    const payLaterCopy = await screen.findByText('Your plan starts after approval. Pay within 14 days to keep access.')
    expect(payLaterCopy).toBeInTheDocument()
  })

  it('renders generic fallback text when bank instruction fields are empty (UX-15)', async () => {
    mockBillingPlansApi.getBankInstructions.mockResolvedValue({
      data: { bankName: null, accountTitle: null, accountNumber: null, iban: null, swiftCode: null, currency: 'PKR', instructions: null }
    })
    renderComponent()

    const fallbackText = await screen.findByText('Bank details will be shared after your application is reviewed')
    expect(fallbackText).toBeInTheDocument()
    expect(screen.queryByText(/Meezan Bank/i)).not.toBeInTheDocument()
  })

  it('renders dynamic bank details when returned by API and no hardcoded bank (UX-15)', async () => {
    mockBillingPlansApi.getBankInstructions.mockResolvedValue({
      data: {
        bankName: 'Standard Chartered',
        accountTitle: 'GymsEra Official',
        accountNumber: '987654321',
        iban: 'PK00SCBL987654321',
        swiftCode: 'SCBLPKKA',
        currency: 'PKR',
        instructions: 'Include your gym name in reference.',
      }
    })
    renderComponent()

    expect(await screen.findByText('Standard Chartered')).toBeInTheDocument()
    expect(screen.getByText('987654321')).toBeInTheDocument()
    expect(screen.getByText('PK00SCBL987654321')).toBeInTheDocument()
    expect(screen.getByText('Include your gym name in reference.')).toBeInTheDocument()
    expect(screen.queryByText(/Meezan Bank/i)).not.toBeInTheDocument()
  })

  it('GymOwnerRegisterPage default export renders GymOwnerRegister with no props', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <GymOwnerRegisterPage />
      </QueryClientProvider>
    )
    expect(container).toBeInTheDocument()
  })
})

describe('card payment option is behind NEXT_PUBLIC_WEB_CARD_PAYMENTS_ENABLED', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBillingPlansApi.getBankInstructions.mockResolvedValue({ data: {} })
    mockBillingPlansApi.getPlans.mockResolvedValue({
      data: { plans: [{ id: 'bp-1', branchCount: 1, monthlyPrice: 2000, annualPrice: 14400, currency: 'PKR' }] },
    })
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('hides Pay with Card by default even when a matching billing plan exists', async () => {
    renderComponent()
    await screen.findByText('Your plan starts after approval. Pay within 14 days to keep access.')
    await waitFor(() => expect(mockBillingPlansApi.getPlans).toHaveBeenCalled())
    expect(screen.queryByText('Pay with Card')).not.toBeInTheDocument()
  })

  it('shows Pay with Card when the flag is true', async () => {
    vi.stubEnv('NEXT_PUBLIC_WEB_CARD_PAYMENTS_ENABLED', 'true')
    renderComponent()
    expect(await screen.findByText('Pay with Card')).toBeInTheDocument()
  })
})
