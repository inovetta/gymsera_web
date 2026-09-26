/**
 * BILL-14 — the Stripe return page never trusts `?checkout=success`.
 * Success is shown only when the backend, having asked Stripe itself, says
 * the webhook-driven entitlement exists.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const nav = vi.hoisted(() => ({ searchParams: new URLSearchParams() }))
vi.mock('next/navigation', () => ({
  useSearchParams: () => nav.searchParams,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/gymsera-billing',
}))

const toast = vi.hoisted(() => vi.fn())
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }), toast }))

const api = vi.hoisted(() => ({
  getCurrentSubscription: vi.fn(),
  getPlans: vi.fn(),
  getCheckoutSessionStatus: vi.fn(),
  createPortalSession: vi.fn(),
  changePlan: vi.fn(),
  createCheckoutSession: vi.fn(),
}))
vi.mock('@/lib/api/billing-plans', () => ({ billingPlansApi: api }))

import GymsEraBillingPage from '@/app/(dashboard)/gymsera-billing/page'

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <GymsEraBillingPage />
    </QueryClientProvider>
  )
}

const successToastShown = () => toast.mock.calls.some(([arg]) => /payment (successful|confirmed)/i.test(arg?.title ?? ''))

describe('GymsEra billing — Stripe return (BILL-14)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getCurrentSubscription.mockRejectedValue(new Error('No active subscription found'))
  })

  it('?checkout=success without a session id shows no success and asks the server nothing', async () => {
    nav.searchParams = new URLSearchParams('checkout=success')
    renderPage()

    await screen.findByText(/no gymsera subscription found/i)
    expect(screen.queryByText(/payment confirmed/i)).not.toBeInTheDocument()
    expect(successToastShown()).toBe(false)
    expect(api.getCheckoutSessionStatus).not.toHaveBeenCalled()
  })

  it('a session Stripe reports unpaid shows that no plan was activated', async () => {
    nav.searchParams = new URLSearchParams('checkout=success&session_id=cs_open')
    api.getCheckoutSessionStatus.mockResolvedValue({ data: { status: 'open', paymentStatus: 'unpaid', confirmed: false, entitled: false } })
    renderPage()

    expect(await screen.findByText(/payment was not completed/i)).toBeInTheDocument()
    expect(api.getCheckoutSessionStatus).toHaveBeenCalledWith('cs_open')
    expect(successToastShown()).toBe(false)
  })

  it('paid but not yet granted by the webhook shows "activating", not success', async () => {
    nav.searchParams = new URLSearchParams('checkout=success&session_id=cs_paid')
    api.getCheckoutSessionStatus.mockResolvedValue({ data: { status: 'complete', paymentStatus: 'paid', confirmed: true, entitled: false } })
    renderPage()

    expect(await screen.findByText(/activating your plan/i)).toBeInTheDocument()
    expect(successToastShown()).toBe(false)
  })

  it('shows success only once the server confirms the entitlement exists', async () => {
    nav.searchParams = new URLSearchParams('checkout=success&session_id=cs_paid')
    api.getCheckoutSessionStatus.mockResolvedValue({ data: { status: 'complete', paymentStatus: 'paid', confirmed: true, entitled: true } })
    renderPage()

    expect(await screen.findByText(/payment confirmed/i)).toBeInTheDocument()
    expect(successToastShown()).toBe(true)
  })
})
