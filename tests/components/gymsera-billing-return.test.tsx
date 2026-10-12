/**
 * BILL-14 & UX-02 — Thin Stripe-return page.
 * Never trusts `?checkout=success` alone.
 * Success is shown only when the backend, having asked Stripe itself, says
 * the webhook-driven entitlement exists.
 * Replaces the host billing screen and links/redirects to the CMS /settings/billing.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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
  getCheckoutSessionStatus: vi.fn(),
}))
vi.mock('@/lib/api/billing-plans', () => ({ billingPlansApi: api }))

import GymsEraBillingPage from '@/app/(dashboard)/gymsera-billing/page'

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={client}>
      <GymsEraBillingPage />
    </QueryClientProvider>
  )
}

const successToastShown = () => toast.mock.calls.some(([arg]) => /payment (successful|confirmed)/i.test(arg?.title ?? ''))

describe('GymsEra billing — Thin Stripe return (BILL-14 & UX-02)', () => {
  const originalEnv = process.env
  const originalLocation = window.location

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    process.env.NEXT_PUBLIC_CMS_URL = 'https://cms.gymsera.com'

    delete (window as any).location
    window.location = {
      href: '',
      replace: vi.fn(),
    } as any
  })

  afterEach(() => {
    process.env = originalEnv
    window.location = originalLocation
  })

  it('?checkout=success without a session id shows no success, asks server nothing, and links to CMS billing', async () => {
    nav.searchParams = new URLSearchParams('checkout=success')
    renderPage()

    // Must show no subscription found / no session provided
    await screen.findByText(/no gymsera subscription found/i)
    expect(screen.queryByText(/payment confirmed/i)).not.toBeInTheDocument()
    expect(successToastShown()).toBe(false)
    expect(api.getCheckoutSessionStatus).not.toHaveBeenCalled()

    // Links to CMS /settings/billing
    const cmsLink = screen.getByRole('link', { name: /cms billing/i })
    expect(cmsLink).toHaveAttribute('href', 'https://cms.gymsera.com/settings/billing')
  })

  it('a session Stripe reports unpaid shows that no plan was activated and links to CMS billing', async () => {
    nav.searchParams = new URLSearchParams('checkout=success&session_id=cs_open')
    api.getCheckoutSessionStatus.mockResolvedValue({ data: { status: 'open', paymentStatus: 'unpaid', confirmed: false, entitled: false } })
    renderPage()

    expect(await screen.findByText(/payment was not completed/i)).toBeInTheDocument()
    expect(api.getCheckoutSessionStatus).toHaveBeenCalledWith('cs_open')
    expect(successToastShown()).toBe(false)

    const cmsLink = screen.getByRole('link', { name: /cms billing/i })
    expect(cmsLink).toHaveAttribute('href', 'https://cms.gymsera.com/settings/billing')
  })

  it('paid but not yet granted by the webhook shows "activating", not success', async () => {
    nav.searchParams = new URLSearchParams('checkout=success&session_id=cs_paid')
    api.getCheckoutSessionStatus.mockResolvedValue({ data: { status: 'complete', paymentStatus: 'paid', confirmed: true, entitled: false } })
    renderPage()

    expect(await screen.findByText(/activating your plan/i)).toBeInTheDocument()
    expect(successToastShown()).toBe(false)
  })

  it('shows success only once the server confirms entitlement, and links/redirects to CMS /settings/billing', async () => {
    nav.searchParams = new URLSearchParams('checkout=success&session_id=cs_paid')
    api.getCheckoutSessionStatus.mockResolvedValue({ data: { status: 'complete', paymentStatus: 'paid', confirmed: true, entitled: true } })
    renderPage()

    expect(await screen.findByText(/payment confirmed/i)).toBeInTheDocument()
    expect(successToastShown()).toBe(true)

    // Link to CMS /settings/billing is visible
    const cmsLink = screen.getByRole('link', { name: /cms billing/i })
    expect(cmsLink).toHaveAttribute('href', 'https://cms.gymsera.com/settings/billing')

    // Redirects to CMS /settings/billing
    await waitFor(() => {
      expect(window.location.href).toBe('https://cms.gymsera.com/settings/billing')
    }, { timeout: 3000 })
  })

  it('does NOT contain host billing management screen (plans catalog, change plan)', () => {
    nav.searchParams = new URLSearchParams('')
    renderPage()

    expect(screen.queryByText(/choose a new plan/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/manage payment method & invoices/i)).not.toBeInTheDocument()
  })

  it('when CMS URL is missing in production, displays clear message without redirecting', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env.NEXT_PUBLIC_CMS_URL

    nav.searchParams = new URLSearchParams('checkout=success&session_id=cs_paid')
    api.getCheckoutSessionStatus.mockResolvedValue({ data: { status: 'complete', paymentStatus: 'paid', confirmed: true, entitled: true } })
    renderPage()

    expect(await screen.findByText(/payment confirmed/i)).toBeInTheDocument()
    expect(await screen.findByText(/cms url is not configured/i)).toBeInTheDocument()
    expect(window.location.href).toBe('')
  })
})
