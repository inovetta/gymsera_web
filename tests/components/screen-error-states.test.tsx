import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SubscriptionsPage from '@/app/(dashboard)/subscriptions/page'
import SubscriptionDetailPage from '@/app/(dashboard)/subscriptions/[id]/page'
import PaymentsPage from '@/app/(dashboard)/payments/page'
import AccountStatementPage from '@/app/(dashboard)/account-statement/page'
import ProfilePage from '@/app/(dashboard)/profile/page'
import DashboardPage from '@/app/(dashboard)/dashboard/page'
import GymsPage from '@/app/(public)/gyms/page'
import { meApi } from '@/lib/api/me'
import { subscriptionsApi } from '@/lib/api/subscriptions'
import { discoveryApi } from '@/lib/api/discovery'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ id: 'sub-1' }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'u1', fullName: 'Test Person', email: 'test@example.test', createdAt: '2026-01-01T00:00:00Z' },
    isAuthenticated: true,
    isLoading: false,
  }),
}))
vi.mock('@/components/features/gym-map', () => ({ GymMap: () => <div /> }))

const ok = (data: unknown) => ({ success: true, data })
const serverDown = {
  response: { status: 503, data: { error: { code: 'internal_error', message: 'Service unavailable', requestId: 'req_web_1' } } },
}
const notFound = { response: { status: 404, data: { message: 'Not found' } } }

const renderPage = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

async function expectRetryableError(notExpected: RegExp) {
  const state = await screen.findByTestId('error-state')
  expect(state).toHaveTextContent('req_web_1')
  expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  expect(screen.queryByText(notExpected)).toBeNull()
}

describe('web screens show a retryable error instead of an empty or misleading page (UX-08, spec §2.5)', () => {
  afterEach(() => vi.restoreAllMocks())

  it('my subscriptions', async () => {
    vi.spyOn(meApi, 'getSubscriptions').mockRejectedValue(serverDown)
    renderPage(<SubscriptionsPage />)
    await expectRetryableError(/no subscriptions/i)
  })

  it('subscriptions: Retry asks again and recovers', async () => {
    const spy = vi
      .spyOn(meApi, 'getSubscriptions')
      .mockRejectedValueOnce(serverDown)
      .mockResolvedValue(ok({ memberships: [] }) as never)
    renderPage(<SubscriptionsPage />)
    fireEvent.click(await screen.findByRole('button', { name: /retry/i }))
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByTestId('error-state')).toBeNull())
  })

  it('payments are not reported as "no payments" when the load failed', async () => {
    vi.spyOn(meApi, 'getPayments').mockRejectedValue(serverDown)
    renderPage(<PaymentsPage />)
    await expectRetryableError(/no payments/i)
  })

  it('account statement', async () => {
    vi.spyOn(meApi, 'getAccountStatement').mockRejectedValue(serverDown)
    renderPage(<AccountStatementPage />)
    await expectRetryableError(/no transactions|no entries|no statement/i)
  })

  it('profile: no editable form over a profile that never loaded', async () => {
    vi.spyOn(meApi, 'getProfile').mockRejectedValue(serverDown)
    renderPage(<ProfilePage />)
    await expectRetryableError(/save changes/i)
  })

  it('subscription detail: a 503 is an error, a 404 is "not found"', async () => {
    vi.spyOn(meApi, 'getAttendanceLogs').mockResolvedValue(ok([]) as never)
    const detail = vi.spyOn(subscriptionsApi, 'getMySubscriptionDetail').mockRejectedValue(serverDown)
    const first = renderPage(<SubscriptionDetailPage />)
    await expectRetryableError(/subscription not found/i)
    first.unmount()

    detail.mockRejectedValue(notFound)
    renderPage(<SubscriptionDetailPage />)
    expect(await screen.findByText(/subscription not found/i)).toBeInTheDocument()
    expect(screen.queryByTestId('error-state')).toBeNull()
  })

  it('dashboard: a failed membership load is not "No Active Membership"', async () => {
    vi.spyOn(meApi, 'getSubscriptions').mockRejectedValue(serverDown)
    vi.spyOn(meApi, 'getAttendanceLogs').mockResolvedValue(ok([]) as never)
    renderPage(<DashboardPage />)
    await expectRetryableError(/no active membership/i)
  })

  it('public gym list', async () => {
    vi.spyOn(discoveryApi, 'getCities').mockResolvedValue(ok({ cities: [] }) as never)
    vi.spyOn(discoveryApi, 'getGyms').mockRejectedValue(serverDown)
    renderPage(<GymsPage />)
    await expectRetryableError(/no gyms found/i)
  })
})
