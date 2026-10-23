import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { billingNoticesFrom } from '@/lib/billing-notices'

const api = vi.hoisted(() => ({ getCurrentSubscription: vi.fn(), getCheckoutSessionStatus: vi.fn() }))
vi.mock('@/lib/api/billing-plans', () => ({ billingPlansApi: api }))
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/gymsera-billing',
}))
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }), toast: vi.fn() }))

import { BillingNotices } from '@/components/features/billing-notices'
import GymsEraBillingPage from '@/app/(dashboard)/gymsera-billing/page'

// NEW-21 / NEW-32 (spec R-51): the owner sees what GET /host/subscription/current says about the plan.
// Same facts and wording as the mobile BillingNoticesSection and the CMS; the server decides, this words them.

describe('billingNoticesFrom', () => {
  it('nothing wrong: no notices', () => {
    expect(billingNoticesFrom({ status: 'ACTIVE', overQuotaCount: 0, duplicateBilling: false })).toEqual([])
  })

  it('pay later: days left and the date; critical at 2 days or fewer; today at 0', () => {
    const [n] = billingNoticesFrom({ paymentIssue: { provider: 'MANUAL', payBy: '2026-12-10', daysLeft: 5 } })
    expect(n.title).toBe('Payment due')
    expect(n.message).toContain('5 days')
    expect(n.message).toContain('2026-12-10')
    expect(n.severity).toBe('warning')
    expect(billingNoticesFrom({ paymentIssue: { provider: 'MANUAL', payBy: 'x', daysLeft: 2 } })[0].severity).toBe('critical')
    expect(billingNoticesFrom({ paymentIssue: { provider: 'MANUAL', payBy: 'x', daysLeft: 0 } })[0].message).toContain('today')
  })

  it('failed store renewal: the plan is kept while the store retries, with the store link; unsafe links are dropped', () => {
    const [n] = billingNoticesFrom({ paymentIssue: { provider: 'IOS', manageUrl: 'https://apps.apple.com/account/subscriptions' } })
    expect(n.title).toBe('Payment problem')
    expect(n.message).toContain('App Store')
    expect(n.actionUrl).toBe('https://apps.apple.com/account/subscriptions')
    expect(billingNoticesFrom({ paymentIssue: { provider: 'IOS', manageUrl: 'javascript:alert(1)' } })[0].actionUrl).toBeUndefined()
  })

  it('branches over the plan: days left, then locked', () => {
    const [soon] = billingNoticesFrom({ overQuotaCount: 2, overQuotaGraceRemainingDays: 4 })
    expect(soon.title).toBe("Over your plan's branch capacity")
    expect(soon.message).toContain('4 days')
    expect(billingNoticesFrom({ overQuotaCount: 1, isOverQuotaGraceExpired: true })[0].title).toBe('Branches over your plan are locked')
  })

  it('a second subscription still billing', () => {
    const [n] = billingNoticesFrom({ duplicateBilling: true, duplicateBillingPlatform: 'ANDROID', duplicateBillingManageUrl: 'https://play.google.com/store/account/subscriptions' })
    expect(n.title).toBe('You may be billed twice')
    expect(n.message).toContain('Google Play')
  })
})

const wrap = (ui: React.ReactElement) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('BillingNotices', () => {
  beforeEach(() => {
    api.getCurrentSubscription.mockReset()
    api.getCheckoutSessionStatus.mockReset()
  })

  it('shows the notices as alerts with the action link', async () => {
    api.getCurrentSubscription.mockResolvedValue({ data: { paymentIssue: { provider: 'STRIPE', manageUrl: 'https://billing.stripe.com/p/x' }, overQuotaCount: 1, overQuotaGraceRemainingDays: 1 } })
    wrap(<BillingNotices />)

    expect(await screen.findByText('Payment problem')).toBeInTheDocument()
    expect(screen.getAllByRole('alert')).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Fix payment' })).toHaveAttribute('href', 'https://billing.stripe.com/p/x')
  })

  it('renders nothing when there is no plan or it cannot be read', async () => {
    api.getCurrentSubscription.mockRejectedValue({ response: { status: 404 } })
    const { container } = wrap(<BillingNotices />)
    await waitFor(() => expect(api.getCurrentSubscription).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('is on the GymsEra billing page', async () => {
    api.getCurrentSubscription.mockResolvedValue({ data: { paymentIssue: { provider: 'MANUAL', payBy: '2026-12-10', daysLeft: 3 } } })
    wrap(<GymsEraBillingPage />)

    expect(await screen.findByText('Payment due')).toBeInTheDocument()
    expect(screen.getByText(/3 days left to pay/)).toBeInTheDocument()
  })
})
