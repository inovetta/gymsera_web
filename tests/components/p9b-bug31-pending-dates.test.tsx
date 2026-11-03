import React from 'react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SubscriptionDetailPage from '@/app/(dashboard)/subscriptions/[id]/page'
import { SubscriptionCard } from '@/components/features/subscription-card'
import { subscriptionsApi } from '@/lib/api/subscriptions'
import { meApi } from '@/lib/api/me'

/**
 * Phase 7 P9b item 6, BUG-31 on the website. Before: subscriptions/[id] and the subscription card
 * printed Start Date / End Date for a request still waiting for the host; the API replaces those
 * dates with the approval day (subscription.service.js#datesOnApproval), so the member saw dates
 * that were never true. The app shows "Starts when the host approves" (P7a). A plan change scheduled
 * for the next cycle (pendingChangeEffectiveDate) was not shown.
 */
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 's1' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))
vi.mock('@/hooks/use-auth', () => ({ useAuth: () => ({ user: { id: 'u1', fullName: 'Ali Raza' } }) }))
vi.mock('@/components/features/qr-code-display', () => ({ QRCodeDisplay: () => <div /> }))

const ok = <T,>(data: T) => ({ success: true, message: 'ok', data })
const plan = { name: 'Monthly', durationType: 'MONTHLY', durationValue: 1, price: 3000 }
const pending = { id: 's1', status: 'PENDING', startDate: '2026-10-20', endDate: '2026-11-20', plan, branch: { branchName: 'Uptown' } }
const changing = { ...pending, status: 'ACTIVE', startDate: '2026-10-01', endDate: '2026-11-01', pendingPlanId: 'p2', pendingChangeEffectiveDate: '2026-11-01' }

const mount = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SubscriptionDetailPage />
    </QueryClientProvider>
  )

beforeEach(() => {
  vi.spyOn(meApi, 'getAttendanceLogs').mockResolvedValue(ok([]) as never)
})
afterEach(() => vi.restoreAllMocks())

describe('subscriptions/[id]', () => {
  it('a pending request says it starts when the host approves, with no dates', async () => {
    vi.spyOn(subscriptionsApi, 'getMySubscriptionDetail').mockResolvedValue(ok({ subscription: pending, payment: null, invoice: null }) as never)
    mount()
    expect(await screen.findByText('Starts when the host approves')).toBeInTheDocument()
    expect(screen.queryByText('Start Date')).not.toBeInTheDocument()
    expect(screen.queryByText(/Oct 20, 2026|Nov 20, 2026/)).not.toBeInTheDocument()
  })

  it('a scheduled plan change shows the date the API stores', async () => {
    vi.spyOn(subscriptionsApi, 'getMySubscriptionDetail').mockResolvedValue(ok({ subscription: changing, payment: null, invoice: null }) as never)
    mount()
    expect(await screen.findByText(/Your plan changes on Nov 01, 2026/)).toBeInTheDocument()
  })
})

describe('SubscriptionCard', () => {
  it('a pending request has no start or end date', () => {
    render(<SubscriptionCard subscription={pending as never} />)
    expect(screen.getByText('Starts when the host approves')).toBeInTheDocument()
    expect(screen.queryByText('Start Date')).not.toBeInTheDocument()
    expect(screen.queryByText('End Date')).not.toBeInTheDocument()
  })

  it('an active membership keeps its dates', () => {
    render(<SubscriptionCard subscription={{ ...pending, status: 'ACTIVE' } as never} />)
    expect(screen.getByText('Start Date')).toBeInTheDocument()
    expect(screen.getByText(/Oct 20, 2026/)).toBeInTheDocument()
  })
})
