import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { billingNoticesFrom } from '@/lib/billing-notices'

const api = vi.hoisted(() => ({ getCurrentSubscription: vi.fn(), getCheckoutSessionStatus: vi.fn() }))
vi.mock('@/lib/api/billing-plans', () => ({ billingPlansApi: api }))

import { BillingNotices } from '@/components/features/billing-notices'

// NEW-180: since P7c (R-82) GET /host/subscription/current answers 200 with the ended plan (`entitled:
// false` and a `lapse` block) where it used to answer 404. The web reads it only for the billing notices,
// which worded the lapse as "Over your plan's branch capacity ... 0 days left before the extra branches
// are locked". The pre-P9 guard showed nothing; P9 shows the lapse itself, in the mobile wording
// (my_subscription_screen.dart _LapsedPlanCard), and still never the over-quota countdown.

const lapsed = (lapse: Record<string, unknown> = {}, over: Record<string, unknown> = {}) => ({
  id: 'sub-1', status: 'EXPIRED', platform: 'MANUAL', branchCount: 3, overQuotaCount: 3, endDate: '2026-10-28T12:00:00Z',
  entitled: false, paymentIssue: null,
  lapse: { status: 'EXPIRED', reason: 'expired', provider: 'MANUAL', manageUrl: null, branchesLockAt: '2026-11-04T12:00:00Z', inGrace: true, remainingDays: 5, ...lapse },
  ...over,
})

describe('NEW-180: a plan that does not entitle on the web', () => {
  beforeEach(() => api.getCurrentSubscription.mockReset())

  it('one notice: the lapse, never the over-quota countdown', () => {
    const notices = billingNoticesFrom(lapsed())
    expect(notices).toHaveLength(1)
    expect(notices[0]).toMatchObject({ title: 'Plan ended', severity: 'critical' })
    expect(notices[0].message).toMatch(/Your plan ended on Oct 28, 2026\./)
    expect(notices[0].message).toMatch(/Your branches stay open until Nov 04, 2026\./)
    expect(notices.map((n) => n.title)).not.toContain("Over your plan's branch capacity")
    expect(JSON.stringify(notices)).not.toMatch(/0 days left/)
  })

  it('on hold at the App Store: the store link fixes it', () => {
    const [n] = billingNoticesFrom(lapsed({ status: 'ON_HOLD', reason: 'on_hold', provider: 'IOS', manageUrl: 'https://apps.apple.com/account/subscriptions' }, { platform: 'IOS' }))
    expect(n.title).toBe('On hold')
    expect(n.message).toMatch(/The App Store couldn't take your renewal payment/)
    expect(n).toMatchObject({ actionLabel: 'Fix payment in App Store', actionUrl: 'https://apps.apple.com/account/subscriptions' })
  })

  it('paused in Google Play; refunded and locked', () => {
    expect(billingNoticesFrom(lapsed({ status: 'PAUSED', reason: 'paused', provider: 'ANDROID', manageUrl: 'https://play.google.com/store/account/subscriptions' }))[0])
      .toMatchObject({ title: 'Paused', actionLabel: 'Resume in Google Play' })
    const [refunded] = billingNoticesFrom(lapsed({ status: 'REVOKED', reason: 'refunded', provider: 'IOS', inGrace: false, branchesLockAt: null }))
    expect(refunded.title).toBe('Refunded')
    expect(refunded.message).toMatch(/Your branches are locked: no new members, sales or plans\./)
    expect(refunded.actionUrl).toBeUndefined()
  })

  it('a lapse block without a reason, or no lapse block: no notice is invented', () => {
    expect(billingNoticesFrom({ ...lapsed(), lapse: null })).toEqual([])
  })

  it('BillingNotices shows the lapse notice', async () => {
    api.getCurrentSubscription.mockResolvedValue({ data: lapsed() })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
    render(<QueryClientProvider client={client}><BillingNotices /></QueryClientProvider>)
    expect(await screen.findByText('Plan ended')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Your plan ended on Oct 28, 2026.'))
  })

  it('an entitling plan over capacity still gets its notice', () => {
    expect(billingNoticesFrom({ ...lapsed(), entitled: true, lapse: null, overQuotaCount: 1, overQuotaGraceRemainingDays: 4 })[0].title)
      .toBe("Over your plan's branch capacity")
  })
})
