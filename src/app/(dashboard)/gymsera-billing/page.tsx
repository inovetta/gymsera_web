'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, AlertTriangle, RefreshCw, CreditCard, ExternalLink } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { billingPlansApi } from '@/lib/api/billing-plans'
import { BillingNotices } from '@/components/features/billing-notices'
import { useToast } from '@/hooks/use-toast'
import { getCmsUrl } from '@/lib/cms'
import { cn } from '@/lib/utils'

// Return-from-Stripe confirmation polling: every 3 s for up to ~1 minute.
const CONFIRM_POLL_MS = 3000
const CONFIRM_MAX_POLLS = 20

/**
 * UX-02 & BILL-14: Thin Stripe-return page.
 * The host billing screen has moved to the CMS (/settings/billing).
 * This page serves only to verify returning Stripe checkout sessions server-side
 * via GET /billing/stripe/session/:id, ensure ?checkout=success alone never grants
 * or shows success, and then link/redirect to the CMS /settings/billing.
 */
export default function GymsEraBillingPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const checkoutResult = searchParams.get('checkout')
  const sessionId = searchParams.get('session_id')

  const cmsUrl = getCmsUrl()
  const cmsBillingUrl = cmsUrl ? `${cmsUrl}/settings/billing` : null

  useEffect(() => {
    if (checkoutResult === 'cancelled') {
      toast({
        title: 'Checkout cancelled',
        description: 'No payment was made — you can try again anytime.',
        variant: 'destructive',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutResult])

  // Polling server-side status of Checkout Session
  const sessionCheck = useQuery({
    queryKey: ['stripe-checkout-session', sessionId],
    queryFn: () => billingPlansApi.getCheckoutSessionStatus(sessionId!),
    enabled: !!sessionId,
    retry: false,
    refetchInterval: (query) => {
      const s = query.state.data?.data
      const settled = s && (s.entitled || !s.confirmed)
      return settled || query.state.dataUpdateCount >= CONFIRM_MAX_POLLS ? false : CONFIRM_POLL_MS
    },
  })

  const checkout = sessionCheck.data?.data
  const checkoutEntitled = checkout?.entitled === true

  useEffect(() => {
    if (!checkoutEntitled) return
    toast({
      title: 'Payment confirmed',
      description: 'Your GymsEra subscription is now active.',
      variant: 'success',
    })

    if (cmsBillingUrl) {
      const timer = setTimeout(() => {
        window.location.href = cmsBillingUrl
      }, 500)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutEntitled, cmsBillingUrl])

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">GymsEra Billing</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Stripe payment confirmation. Host billing management lives in the CMS portal.
        </p>
      </div>

      <BillingNotices />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!sessionId ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-xl bg-muted/60 p-4 text-sm">
                <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  {/* NEW-180 (P9): this says nothing about the plan (a lapsed or active host lands here too). */}
                  <p className="font-semibold text-foreground">No payment to confirm</p>
                  <p className="text-muted-foreground mt-0.5">
                    This page confirms a card payment after checkout. Your GymsEra plan is on the CMS billing page.
                  </p>
                </div>
              </div>

              {cmsBillingUrl ? (
                <a
                  href={cmsBillingUrl}
                  className={cn(buttonVariants({ variant: 'default' }), 'w-full')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Go to CMS Billing
                </a>
              ) : (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                  Open the GymsEra CMS to see and manage your plan.
                </div>
              )}
            </div>
          ) : sessionCheck.isError ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-4 rounded-xl">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>We couldn&apos;t verify this payment.</span>
              </div>
              {cmsBillingUrl && (
                <a
                  href={cmsBillingUrl}
                  className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Go to CMS Billing
                </a>
              )}
            </div>
          ) : !checkout ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground p-4">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              <span>Confirming payment…</span>
            </div>
          ) : checkout.entitled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 p-4 rounded-xl">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span className="font-medium">Payment confirmed. Your subscription is active.</span>
              </div>

              {cmsBillingUrl ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Redirecting to CMS billing settings…</p>
                  <a
                    href={cmsBillingUrl}
                    className={cn(buttonVariants({ variant: 'default' }), 'w-full')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Go to CMS Billing
                  </a>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                  Open the GymsEra CMS to see and manage your plan.
                </div>
              )}
            </div>
          ) : checkout.confirmed ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground p-4">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              <span>Payment received — activating your plan…</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-4 rounded-xl">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>This payment was not completed. No plan was activated.</span>
              </div>
              {cmsBillingUrl && (
                <a
                  href={cmsBillingUrl}
                  className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Go to CMS Billing
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
