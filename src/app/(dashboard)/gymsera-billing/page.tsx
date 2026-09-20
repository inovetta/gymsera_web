'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { CreditCard, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/features/empty-state'
import { BillingPlanCard } from '@/components/features/billing-plan-card'
import { billingPlansApi } from '@/lib/api/billing-plans'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDate } from '@/lib/utils'

// GymsEra's own platform subscription (branch-count plan) — distinct from
// the member-facing "My Subscriptions" page (a gym membership someone
// bought), which lives at /subscriptions. This page is for a HOST managing
// their own GymsEra account, whichever provider (Apple/Google/Stripe/manual)
// it's billed through.
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
  PENDING_MIGRATION: 'Updating…',
  PENDING_CANCEL: 'Action needed',
  SCHEDULED: 'Cancelling at period end',
}

const PLATFORM_LABEL: Record<string, string> = {
  MANUAL: 'Bank Transfer / Manual',
  IOS: 'Apple App Store',
  ANDROID: 'Google Play',
  STRIPE: 'Card (Stripe)',
}

export default function GymsEraBillingPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const checkoutResult = searchParams.get('checkout')
  const [changingPlan, setChangingPlan] = useState(false)
  const [changeCycle, setChangeCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')

  useEffect(() => {
    if (checkoutResult === 'success') {
      toast({ title: 'Payment successful', description: 'Your GymsEra subscription is now active.', variant: 'success' })
    } else if (checkoutResult === 'cancelled') {
      toast({ title: 'Checkout cancelled', description: 'No payment was made — you can try again anytime.', variant: 'destructive' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutResult])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['gymsera-subscription'],
    queryFn: () => billingPlansApi.getCurrentSubscription(),
    retry: false,
  })

  const subscription = data?.data

  const { data: plansData } = useQuery({
    queryKey: ['billing-plans-catalog'],
    queryFn: () => billingPlansApi.getPlans(),
    enabled: changingPlan,
  })
  const plans = plansData?.data?.plans || []

  const handleManageBilling = async () => {
    try {
      const res = await billingPlansApi.createPortalSession(window.location.href)
      window.location.href = res.data.url
    } catch {
      toast({ title: 'Could not open billing portal', variant: 'destructive' })
    }
  }

  // Same-provider (Stripe → Stripe) upgrade/downgrade — updates the
  // existing Stripe subscription's price in place rather than starting a
  // new checkout (which would create a second, duplicate-billing Stripe
  // subscription — see stripe-billing.service.js#changeSubscriptionPlan on
  // the backend). Applies once the resulting webhook confirms it.
  const changePlanMutation = useMutation({
    mutationFn: (billingPlanId: string) => billingPlansApi.changePlan({ billingPlanId, billingCycle: changeCycle }),
    onSuccess: () => {
      toast({ title: 'Plan change requested', description: 'This updates automatically once Stripe confirms it — usually within a few seconds.', variant: 'success' })
      setChangingPlan(false)
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ['gymsera-subscription'] }), 3000)
    },
    onError: (err: any) => toast({ title: 'Could not change plan', description: err?.response?.data?.message, variant: 'destructive' }),
  })

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">GymsEra Billing</h1>
        <p className="text-muted-foreground mt-1">Your GymsEra account subscription — separate from any gym membership.</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-56 rounded-xl" />
      ) : !subscription ? (
        <EmptyState
          icon={CreditCard}
          title="No GymsEra subscription found"
          description="This account doesn't have an active GymsEra branch-count subscription yet."
          actionLabel="Register your gym"
          actionHref="/gym-owner/register"
        />
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="text-xl font-bold">
                {subscription.branchCount ? `Up to ${subscription.branchCount} branches` : 'Custom plan'}
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                subscription.status === 'ACTIVE'
                  ? 'text-success border-success/30 bg-success/10'
                  : subscription.status === 'PENDING_CANCEL'
                    ? 'text-warning border-warning/30 bg-warning/10'
                    : 'text-muted-foreground'
              }
            >
              {STATUS_LABEL[subscription.status] || subscription.status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Billed via</p>
                <p className="font-medium">{PLATFORM_LABEL[subscription.platform] || subscription.platform}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Price</p>
                <p className="font-medium">
                  {formatCurrency(subscription.amount)} / {subscription.billingCycle.toLowerCase()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Renews / expires</p>
                <p className="font-medium">{formatDate(subscription.endDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Auto-renew</p>
                <p className="font-medium">{subscription.autoRenew ? 'On' : 'Off'}</p>
              </div>
            </div>

            {subscription.statusNote && (
              <div className="flex items-start gap-3 rounded-xl bg-warning/10 border border-warning/30 p-4 text-sm">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <span>{subscription.statusNote}</span>
              </div>
            )}

            {subscription.overQuotaCount > 0 && (
              <div className="flex items-start gap-3 rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-sm">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <span>
                  You have {subscription.overQuotaCount} more active {subscription.overQuotaCount === 1 ? 'branch' : 'branches'} than
                  your current plan covers. Upgrade to restore full access.
                </span>
              </div>
            )}

            {subscription.status === 'ACTIVE' && subscription.platform === 'STRIPE' && (
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleManageBilling} variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage payment method & invoices
                </Button>
                <Button onClick={() => setChangingPlan((v) => !v)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {changingPlan ? 'Cancel' : 'Change plan'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {changingPlan && subscription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="font-semibold">Choose a new plan</p>
              <div className="flex gap-1 rounded-lg bg-muted p-1 text-sm">
                <button
                  className={`px-3 py-1 rounded-md ${changeCycle === 'MONTHLY' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}
                  onClick={() => setChangeCycle('MONTHLY')}
                >
                  Monthly
                </button>
                <button
                  className={`px-3 py-1 rounded-md ${changeCycle === 'YEARLY' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}
                  onClick={() => setChangeCycle('YEARLY')}
                >
                  Annual
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <BillingPlanCard
                  key={plan.id}
                  plan={plan}
                  annual={changeCycle === 'YEARLY'}
                  selected={plan.branchCount === subscription.branchCount}
                  onSelect={(p) => changePlanMutation.mutate(p.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {checkoutResult === 'success' && (
        <div className="flex items-center gap-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" />
          Payment confirmed.
          <button onClick={() => refetch()} className="underline underline-offset-2">Refresh status</button>
        </div>
      )}
    </div>
  )
}
