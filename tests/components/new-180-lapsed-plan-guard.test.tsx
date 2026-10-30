import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { billingNoticesFrom } from '@/lib/billing-notices'

const api = vi.hoisted(() => ({ getCurrentSubscription: vi.fn(), getCheckoutSessionStatus: vi.fn() }))
vi.mock('@/lib/api/billing-plans', () => ({ billingPlansApi: api }))

import { BillingNotices } from '@/components/features/billing-notices'

// NEW-180 (safety guard until P9 builds the lapse view): since P7c (R-82) GET /host/subscription/current
// answers 200 with the ended plan (`entitled: false` and a `lapse` block) where it used to answer 404.
// The web reads it only for the billing notices, which worded the lapse as "Over your plan's branch
// capacity ... 0 days left before the extra branches are locked". Until P9 it shows nothing, as before P7c.

const lapsed = {
  id: 'sub-1', status: 'EXPIRED', platform: 'MANUAL', branchCount: 3, overQuotaCount: 3,
  entitled: false, paymentIssue: null,
  lapse: { status: 'EXPIRED', reason: 'expired', provider: 'MANUAL', manageUrl: null, inGrace: true, remainingDays: 5 },
}

describe('NEW-180: a plan that does not entitle has no notices on the web', () => {
  beforeEach(() => api.getCurrentSubscription.mockReset())

  it('billingNoticesFrom: nothing for a lapsed plan', () => {
    expect(billingNoticesFrom(lapsed)).toEqual([])
  })

  it('BillingNotices renders nothing for a lapsed plan', async () => {
    api.getCurrentSubscription.mockResolvedValue({ data: lapsed })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
    const { container } = render(<QueryClientProvider client={client}><BillingNotices /></QueryClientProvider>)
    await waitFor(() => expect(api.getCurrentSubscription).toHaveBeenCalled())
    await new Promise((r) => setTimeout(r, 0))
    expect(container).toBeEmptyDOMElement()
  })

  it('an entitling plan over capacity still gets its notice', () => {
    expect(billingNoticesFrom({ ...lapsed, entitled: true, lapse: null, overQuotaCount: 1, overQuotaGraceRemainingDays: 4 })[0].title)
      .toBe("Over your plan's branch capacity")
  })
})
