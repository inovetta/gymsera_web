import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import BranchDetailPage from '@/app/(public)/gyms/[id]/branches/[branchId]/page'
import { SubscribeFlowDialog, COPY } from '@/components/features/subscribe-flow-dialog'
import { subscriptionsApi } from '@/lib/api/subscriptions'
import { discoveryApi } from '@/lib/api/discovery'
import { meApi } from '@/lib/api/me'

/**
 * Phase 7 P9c (B): the website's "Confirm Subscription" sent the booking at once and said
 * "Your membership has been activated". It now follows the app (payment_screen.dart): review →
 * the gym's bank details and the server's amount → the receipt image is required (API limits:
 * JPEG / PNG / WebP, 10 MB; the app's wording) → payment request + receipt → awaiting approval.
 */
const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ id: 'gym-1', branchId: 'br-1' }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a> }))
vi.mock('next/image', () => ({ default: (props: any) => <img alt={props.alt} /> }))
vi.mock('@/hooks/use-auth', () => ({ useAuth: () => ({ user: { id: 'u1' }, isAuthenticated: true, isLoading: false }) }))
vi.mock('@/components/features/gym-map', () => ({ GymMap: () => <div /> }))

const plan = {
  id: 'plan-1', gymId: 'gym-1', branchId: 'br-1', name: 'Monthly Pass', durationType: 'MONTHLY', durationValue: 1,
  price: 3000, currency: 'PKR', joiningFee: 0, securityFee: 0, freezeLimitDays: 0, isTrial: false, status: 'ACTIVE',
} as any
const branch = { id: 'br-1', branchName: 'Main Branch', address: 'Street 1' }
const bankDetails = { bankName: 'Meezan', accountTitle: 'Iron Gym', accountNumber: '0123456789', iban: null, jazzCashNumber: null, easyPaisaNumber: null }

const wrap = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>)
const dialog = () =>
  wrap(<SubscribeFlowDialog open onOpenChange={() => {}} plan={plan} branch={branch} gymListingId="gym-1" />)
const jpeg = (size = 1000, type = 'image/jpeg') => {
  const f = new File(['x'], 'receipt.jpg', { type })
  Object.defineProperty(f, 'size', { value: size })
  return f
}

beforeEach(() => {
  vi.restoreAllMocks()
  push.mockReset()
  vi.spyOn(subscriptionsApi, 'createSubscription').mockResolvedValue({
    success: true,
    data: { subscription: { id: 'sub-1' }, payment: { id: 'pay-0', amount: '3000.00', currency: 'PKR' }, invoice: {} },
  } as any)
  vi.spyOn(discoveryApi, 'getPaymentDetails').mockResolvedValue(bankDetails)
  vi.spyOn(meApi, 'submitPaymentRequest').mockResolvedValue({ success: true, data: { payment: { id: 'pay-1' } } } as any)
  vi.spyOn(meApi, 'uploadPaymentProof').mockResolvedValue({ success: true, data: {} } as any)
})

const toPayment = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Continue to payment' }))
  await screen.findByTestId('bank-details')
}

describe('website subscribe flow (P9c B)', () => {
  it('the branch page shows the gym\'s bank details and the server\'s amount before anything is paid', async () => {
    vi.spyOn(discoveryApi, 'getGym').mockResolvedValue({ success: true, data: { id: 'gym-1', branches: [branch], membershipPlans: [plan] } } as any)
    wrap(<BranchDetailPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Subscribe Now' }))
    const modal = await screen.findByRole('dialog')
    fireEvent.click(within(modal).getByRole('button', { name: /Continue to payment/ }))

    expect(await within(modal).findByTestId('bank-details')).toHaveTextContent('Account No: 0123456789')
    expect(within(modal).getByTestId('amount-due')).toHaveTextContent('3,000')
    expect(meApi.submitPaymentRequest).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
    expect(screen.queryByText(/has been activated/)).toBeNull()
  })

  it('the receipt is required, with the app\'s wording; nothing is sent without it', async () => {
    dialog()
    await toPayment()
    fireEvent.click(screen.getByRole('button', { name: "I've Paid — Upload Receipt" }))
    expect(await screen.findByText(COPY.proofRequired)).toBeInTheDocument()
    expect(meApi.submitPaymentRequest).not.toHaveBeenCalled()
  })

  it('only JPEG / PNG / WebP up to 10 MB, with the API\'s wording', async () => {
    dialog()
    await toPayment()
    const input = screen.getByTestId('proof-input')
    fireEvent.change(input, { target: { files: [jpeg(1000, 'application/pdf')] } })
    expect(await screen.findByText(COPY.proofType)).toBeInTheDocument()
    fireEvent.change(input, { target: { files: [jpeg(10 * 1024 * 1024 + 1)] } })
    expect(await screen.findByText(COPY.proofSize)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: "I've Paid — Upload Receipt" }))
    expect(meApi.submitPaymentRequest).not.toHaveBeenCalled()
  })

  it('with a receipt: payment request (no amount: the server prices it), then the receipt, then "Awaiting Host Approval"', async () => {
    dialog()
    await toPayment()
    const file = jpeg()
    fireEvent.change(screen.getByTestId('proof-input'), { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: "I've Paid — Upload Receipt" }))

    expect(await screen.findByText(COPY.awaitingBody)).toBeInTheDocument()
    expect(meApi.submitPaymentRequest).toHaveBeenCalledWith({ subscriptionId: 'sub-1', method: 'BANK_TRANSFER' })
    expect(meApi.uploadPaymentProof).toHaveBeenCalledWith('pay-1', file)
    fireEvent.click(screen.getByRole('button', { name: 'View My Requests' }))
    expect(push).toHaveBeenCalledWith('/subscriptions')
  })

  it('a failed receipt upload can be retried without a second payment request', async () => {
    vi.mocked(meApi.uploadPaymentProof)
      .mockRejectedValueOnce({ response: { status: 503, data: { message: 'busy' } } })
      .mockResolvedValueOnce({ success: true, data: {} } as any)
    dialog()
    await toPayment()
    fireEvent.change(screen.getByTestId('proof-input'), { target: { files: [jpeg()] } })
    const send = screen.getByRole('button', { name: "I've Paid — Upload Receipt" })
    fireEvent.click(send)
    await screen.findByRole('alert')
    fireEvent.click(send)
    expect(await screen.findByText(COPY.awaitingBody)).toBeInTheDocument()
    expect(meApi.submitPaymentRequest).toHaveBeenCalledTimes(1)
    expect(meApi.uploadPaymentProof).toHaveBeenCalledTimes(2)
  })

  it('a gym with no bank details: "Send request", pay at the gym, no receipt', async () => {
    vi.mocked(discoveryApi.getPaymentDetails).mockResolvedValue(null)
    dialog()
    fireEvent.click(screen.getByRole('button', { name: 'Continue to payment' }))
    expect(await screen.findByText(COPY.noBank)).toBeInTheDocument()
    expect(screen.queryByTestId('proof-input')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Send request' }))
    await waitFor(() => expect(meApi.submitPaymentRequest).toHaveBeenCalledWith({ subscriptionId: 'sub-1', method: 'CASH' }))
    expect(meApi.uploadPaymentProof).not.toHaveBeenCalled()
  })

  it('the gym\'s details fail to load: an error with retry, and the pay button stays off', async () => {
    vi.mocked(discoveryApi.getPaymentDetails).mockRejectedValue({ request: {}, message: 'Network Error' })
    dialog()
    fireEvent.click(screen.getByRole('button', { name: 'Continue to payment' }))
    expect(await screen.findByTestId('error-state')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: "I've Paid — Upload Receipt" })).toBeDisabled()
  })
})
