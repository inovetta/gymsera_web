import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

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
  discoveryApi: { getCities: vi.fn().mockResolvedValue({ data: { cities: [] } }) },
}))
vi.mock('@/lib/api/packages', () => ({
  packagesApi: { getPackages: vi.fn().mockResolvedValue({ data: [] }) },
}))
vi.mock('@/stores/auth.store', () => {
  const state = { user: { id: 'u1' }, refreshToken: 'tok', setAuth: vi.fn() }
  const store: any = (selector?: any) => (selector ? selector(state) : state)
  store.getState = () => state
  return { useAuthStore: store }
})
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'u1' }, isAuthenticated: true, isLoading: false, setAuth: vi.fn() }),
}))

import { GymOwnerRegister } from '@/components/features/gym-owner-register'

const pkg = { id: 'pkg-1', name: 'Starter', price: 5000, billingCycle: 'MONTHLY', maxBranches: 1, status: 'ACTIVE' }

const renderPayment = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <GymOwnerRegister initialStep={5} initialPackage={pkg as any} />
    </QueryClientProvider>,
  )

describe('UX-24 A4: terms checkbox on the payment step', () => {
  beforeEach(() => vi.clearAllMocks())

  it('disables Submit Application until the terms checkbox is ticked', async () => {
    renderPayment()
    const submit = await screen.findByRole('button', { name: /submit application/i })
    const box = screen.getByRole('checkbox', { name: /terms of service and privacy policy/i })
    expect(box).not.toBeChecked()
    expect(submit).toBeDisabled()

    fireEvent.click(box)
    expect(submit).toBeEnabled()

    fireEvent.click(box)
    expect(submit).toBeDisabled()
  })

  it('does not call finalizeApplication while unchecked', async () => {
    renderPayment()
    const submit = await screen.findByRole('button', { name: /submit application/i })
    fireEvent.click(submit)
    await waitFor(() => expect(mockTenants.finalizeApplication).not.toHaveBeenCalled())
  })

  it('links to the real /terms and /privacy routes', async () => {
    renderPayment()
    await screen.findByRole('checkbox', { name: /terms of service and privacy policy/i })
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
  })

  it('does not send the checkbox to the backend (mobile keeps it UI-only)', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/features/gym-owner-register.tsx'), 'utf8')
    const call = src.slice(src.indexOf('tenantsApi.finalizeApplication('))
    const body = call.slice(0, call.indexOf('}),') + 3)
    expect(body).toContain("paymentMethod: paymentMethod === 'bank' ? 'BANK_TRANSFER' : 'PAY_LATER'")
    expect(body).toContain('bankTransferRef: bankRef || undefined')
    expect(body).not.toMatch(/terms|agree/i)
  })
})
