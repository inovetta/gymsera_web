'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Calendar, Clock, Info, Landmark, Lock, MapPin, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ErrorState } from '@/components/features/error-state'
import { discoveryApi, HostPaymentDetails } from '@/lib/api/discovery'
import { subscriptionsApi } from '@/lib/api/subscriptions'
import { meApi } from '@/lib/api/me'
import { resolveApiError } from '@/lib/api/error-copy'
import { MembershipPlan } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

/**
 * Phase 7 P9c (B): the website books a plan the way the app does
 * (gyms_era subscriptions/presentation/screens/payment_screen.dart):
 *   1. review the plan → the server creates the pending booking and prices it (no fee, R-74);
 *   2. the gym's own bank / wallet details and the server's amount → the traveller transfers,
 *      then picks the receipt (required) → payment request + receipt upload;
 *      a gym with no bank details: "Send request" and pay at the gym (no receipt);
 *   3. "Awaiting Host Approval".
 * The old dialog sent the booking on "Confirm Subscription" and said "Your membership has been
 * activated", which was not true.
 */

// The API's own limits (gymsera_be src/middleware/upload.js) and wording.
export const PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const PROOF_MAX_BYTES = 10 * 1024 * 1024
export const COPY = {
  proofRequired: 'Screenshot proof is required to submit manual bank transfer payment.',
  proofType: 'Only JPEG, PNG and WebP images are accepted',
  proofSize: 'File size must not exceed 10 MB',
  noBank: "This gym hasn't added bank details yet — send a request instead. You pay the gym directly and the host confirms your plan.",
  payDirect: 'You pay the gym directly by bank transfer or mobile wallet. GymsEra never asks for your card details.',
  awaitingTitle: 'Awaiting Host Approval',
  awaitingBody: 'Your payment proof has been uploaded. The host is verifying your transfer. Please check back shortly.',
  requestBody: 'Your request has been sent. Pay the gym directly; the host confirms your plan.',
} as const

const present = (v?: string | null): v is string => !!v && v.trim().length > 0
const hasBankAccount = (d: HostPaymentDetails | null | undefined) => !!d && (present(d.accountNumber) || present(d.iban))

type Step = 'review' | 'payment' | 'done'

interface SubscribeFlowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: MembershipPlan | null
  branch: { id: string; branchName: string; address?: string | null } | null
  gymListingId: string
}

export function SubscribeFlowDialog({ open, onOpenChange, plan, branch, gymListingId }: SubscribeFlowDialogProps) {
  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('review')
  const [booking, setBooking] = useState<{ subscriptionId: string; amount: number; currency?: string } | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [proof, setProof] = useState<File | null>(null)
  const [proofError, setProofError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [sentWithProof, setSentWithProof] = useState(false)

  // A new plan or a reopened dialog starts again at the review.
  useEffect(() => {
    if (open) return
    setStep('review')
    setBooking(null)
    setPaymentId(null)
    setProof(null)
    setProofError(null)
    setFormError(null)
  }, [open, plan?.id, branch?.id])

  const details = useQuery({
    queryKey: ['gym-payment-details', gymListingId],
    queryFn: () => discoveryApi.getPaymentDetails(gymListingId),
    enabled: open && step === 'payment',
  })
  const detailsReady = details.isSuccess
  const bank = hasBankAccount(details.data)
  const wallets = [
    present(details.data?.jazzCashNumber) ? { id: 'jazzcash', title: 'JazzCash', number: details.data!.jazzCashNumber! } : null,
    present(details.data?.easyPaisaNumber) ? { id: 'easypaisa', title: 'EasyPaisa', number: details.data!.easyPaisaNumber! } : null,
  ].filter(Boolean) as Array<{ id: string; title: string; number: string }>
  // No bank account and no wallet: the traveller sends the request and pays at the gym (app: requestOnly).
  const requestOnly = detailsReady && !bank && wallets.length === 0

  const book = useMutation({
    mutationFn: () => subscriptionsApi.createSubscription({ planId: plan!.id, gymListingId, branchId: branch!.id }),
    onSuccess: (res) => {
      const amount = Number(res.data.payment?.amount ?? 0)
      setBooking({ subscriptionId: res.data.subscription.id, amount, currency: res.data.payment?.currency })
      setFormError(null)
      // A free plan needs no payment (the app skips the payment request too).
      if (amount === 0) {
        setSentWithProof(false)
        setStep('done')
      } else {
        setStep('payment')
      }
    },
    onError: (err) => setFormError(resolveApiError(err).message),
  })

  const pay = useMutation({
    mutationFn: async () => {
      let id = paymentId
      if (!id) {
        const res = await meApi.submitPaymentRequest({
          subscriptionId: booking!.subscriptionId,
          method: requestOnly ? 'CASH' : 'BANK_TRANSFER',
        })
        id = res.data.payment.id
        setPaymentId(id)
      }
      if (!requestOnly) await meApi.uploadPaymentProof(id, proof!)
    },
    onSuccess: () => {
      setSentWithProof(!requestOnly)
      setFormError(null)
      setStep('done')
    },
    onError: (err) => setFormError(resolveApiError(err).message),
  })

  const pickProof = (file: File | undefined) => {
    setFormError(null)
    if (!file) return
    if (!PROOF_TYPES.includes(file.type)) {
      setProof(null)
      setProofError(COPY.proofType)
      return
    }
    if (file.size > PROOF_MAX_BYTES) {
      setProof(null)
      setProofError(COPY.proofSize)
      return
    }
    setProofError(null)
    setProof(file)
  }

  const submit = () => {
    if (!requestOnly && !proof) {
      setProofError(COPY.proofRequired)
      return
    }
    pay.mutate()
  }

  if (!plan || !branch) return null
  const currency = booking?.currency || plan.currency
  const total = booking ? formatCurrency(booking.amount, currency) : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'review' ? 'Confirm Subscription' : step === 'payment' ? 'Payment' : COPY.awaitingTitle}
          </DialogTitle>
        </DialogHeader>

        {step === 'review' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">{branch.branchName.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{branch.branchName}</p>
                {branch.address && (
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 shrink-0" />{branch.address}
                  </p>
                )}
              </div>
              <Badge variant="outline" className="text-success border-success/30 bg-success/10 shrink-0 text-xs">Selected</Badge>
            </div>
            <div className="bg-muted rounded-xl p-4 space-y-3">
              <Row label="Plan" value={plan.name} />
              <Row label="Duration" value={`${plan.durationValue} ${plan.durationType.toLowerCase()}`} />
              <Row label="Price" value={formatCurrency(Number(plan.price), plan.currency)} />
              {Number(plan.joiningFee) > 0 && <Row label="Joining Fee" value={formatCurrency(Number(plan.joiningFee), plan.currency)} />}
              {Number((plan as { securityFee?: number }).securityFee) > 0 && (
                <Row label="Security Fee" value={formatCurrency(Number((plan as { securityFee?: number }).securityFee), plan.currency)} />
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Start Date</span>
                <span className="font-medium flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(new Date())}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Next you see the gym&apos;s payment details. Your plan starts when the host confirms your payment.</p>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
              <span className="text-xs font-bold tracking-wide text-muted-foreground">TOTAL AMOUNT</span>
              <span className="text-lg font-bold" data-testid="amount-due">{total}</span>
            </div>

            {details.isLoading ? (
              <div className="space-y-2" aria-label="Loading the gym's payment details…">
                <Skeleton className="h-24 rounded-xl" />
              </div>
            ) : details.isError ? (
              <ErrorState error={details.error} what="the gym's payment details" onRetry={() => details.refetch()} compact />
            ) : bank ? (
              <div className="rounded-xl border-2 border-primary p-4 space-y-1 text-sm" data-testid="bank-details">
                <p className="font-bold flex items-center gap-2"><Landmark className="h-4 w-4 text-primary" />Bank Transfer</p>
                {present(details.data?.bankName) && <p className="text-xs text-muted-foreground">Bank: {details.data!.bankName}</p>}
                {present(details.data?.accountTitle) && <p className="text-xs text-muted-foreground">Account: {details.data!.accountTitle}</p>}
                {present(details.data?.accountNumber) && <p className="text-xs text-muted-foreground">Account No: {details.data!.accountNumber}</p>}
                {present(details.data?.iban) && <p className="text-xs text-muted-foreground">IBAN: {details.data!.iban}</p>}
                {present(details.data?.branchCode) && <p className="text-xs text-muted-foreground">Branch code: {details.data!.branchCode}</p>}
                {present(details.data?.additionalInstructions) && <p className="text-xs text-muted-foreground">{details.data!.additionalInstructions}</p>}
                <p className="pt-1 text-xs font-medium text-primary">Transfer {total} to the account above. Keep your transfer receipt — you&apos;ll upload it below.</p>
              </div>
            ) : wallets.length === 0 ? (
              <div className="flex items-start gap-3 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                <Info className="h-5 w-5 shrink-0" />{COPY.noBank}
              </div>
            ) : null}

            {detailsReady && wallets.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-bold">Pay with wallet</p>
                {wallets.map((w) => (
                  <div key={w.id} className="flex justify-between rounded-xl border px-4 py-3 text-sm">
                    <span className="font-semibold">{w.title}</span>
                    <span className="text-muted-foreground">{w.number}</span>
                  </div>
                ))}
              </div>
            )}

            {detailsReady && !requestOnly && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Transfer receipt</p>
                <input
                  ref={fileInput}
                  type="file"
                  accept={PROOF_TYPES.join(',')}
                  className="hidden"
                  data-testid="proof-input"
                  onChange={(e) => pickProof(e.target.files?.[0])}
                />
                <Button type="button" variant="outline" className="w-full" onClick={() => fileInput.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />{proof ? proof.name : 'Choose receipt image'}
                </Button>
                <p className="text-xs text-muted-foreground">JPEG, PNG or WebP, up to 10 MB.</p>
                {proofError && <p role="alert" className="text-xs text-destructive">{proofError}</p>}
              </div>
            )}

            <p className="flex items-start gap-2 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />{COPY.payDirect}</p>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-3 py-2 text-sm">
            <p className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              {booking && booking.amount === 0
                ? 'Your request has been sent. The host confirms your plan.'
                : sentWithProof ? COPY.awaitingBody : COPY.requestBody}
            </p>
          </div>
        )}

        {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}

        <DialogFooter>
          {step === 'review' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button loading={book.isPending} onClick={() => book.mutate()}>Continue to payment</Button>
            </>
          )}
          {step === 'payment' && (
            <Button
              className="w-full"
              loading={pay.isPending}
              disabled={!detailsReady || !booking}
              onClick={submit}
            >
              {requestOnly ? 'Send request' : "I've Paid — Upload Receipt"}
            </Button>
          )}
          {step === 'done' && (
            <Button className="w-full" onClick={() => { onOpenChange(false); router.push('/subscriptions') }}>
              View My Requests
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  )
}
