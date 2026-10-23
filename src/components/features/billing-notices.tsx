'use client'

import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { billingPlansApi } from '@/lib/api/billing-plans'
import { billingNoticesFrom } from '@/lib/billing-notices'
import { cn } from '@/lib/utils'

/**
 * The plan's problems for a gym owner (NEW-21, NEW-32), as on the mobile BillingNoticesSection and the CMS:
 * payment due or failed renewal, branches over the plan with days left, a second subscription still billing.
 * The web has no host billing screen (it moved to the CMS, UX-02), so this sits on the one billing page the web keeps.
 * Draws nothing when all is well, when there is no plan, or when the plan could not be read.
 */
export function BillingNotices() {
  const { data } = useQuery({
    queryKey: ['host-subscription-current'],
    queryFn: () => billingPlansApi.getCurrentSubscription(),
    staleTime: 30_000,
    retry: false,
  })
  const sub = data?.data as unknown as Record<string, unknown> | undefined
  if (!sub) return null
  const notices = billingNoticesFrom(sub)
  if (notices.length === 0) return null

  return (
    <div className="space-y-3" data-testid="billing-notices">
      {notices.map((n) => {
        const critical = n.severity === 'critical'
        return (
          <div
            key={n.title}
            role="alert"
            className={cn(
              'flex gap-3 rounded-lg border p-3 text-sm',
              critical ? 'border-destructive/30 bg-red-50 dark:bg-red-950/30' : 'border-primary/30 bg-orange-50 dark:bg-orange-950/30'
            )}
          >
            <AlertTriangle className={cn('mt-0.5 h-5 w-5 shrink-0', critical ? 'text-destructive' : 'text-primary')} />
            <div>
              <p className="font-bold">{n.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{n.message}</p>
              {n.actionUrl && n.actionLabel ? (
                <a
                  href={n.actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn('mt-1.5 inline-block text-xs font-semibold underline', critical ? 'text-destructive' : 'text-primary')}
                >
                  {n.actionLabel}
                </a>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
