'use client'

import { Building2, Check } from 'lucide-react'
import { BillingPlan } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

/**
 * A GymsEra branch-count subscription tier — the platform's own billing
 * plan (how many branches a host's account may run), fetched fresh from the
 * central catalog (GET /billing/plans?platform=web). Deliberately a
 * separate component from PlanCard, which renders a tenant's own member-
 * facing MembershipPlan catalog — an unrelated concept that happens to
 * share a similar card shape.
 */
interface BillingPlanCardProps {
  plan: BillingPlan
  annual: boolean
  onSelect?: (plan: BillingPlan) => void
  highlighted?: boolean
  selected?: boolean
}

export function BillingPlanCard({ plan, annual, onSelect, highlighted = false, selected = false }: BillingPlanCardProps) {
  const price = annual ? plan.annualPrice : plan.monthlyPrice

  return (
    <Card
      className={cn(
        'relative flex flex-col transition-all duration-300',
        selected
          ? 'border-primary shadow-lg shadow-primary/20'
          : highlighted
            ? 'border-primary/60 shadow-md'
            : 'hover:border-primary/50 hover:shadow-md'
      )}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1">Most popular</Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-bold text-lg">
            {plan.branchCount} {plan.branchCount === 1 ? 'branch' : 'branches'}
          </h3>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-primary">{formatCurrency(price, plan.currency)}</span>
            <span className="text-muted-foreground text-sm">/{annual ? 'year' : 'month'}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Check className="h-3 w-3 text-primary" />
            </div>
            Up to {plan.branchCount} {plan.branchCount === 1 ? 'branch' : 'branches'}
          </li>
          <li className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Check className="h-3 w-3 text-primary" />
            </div>
            Unlimited organizations
          </li>
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={selected ? 'default' : 'outline'}
          onClick={() => onSelect?.(plan)}
        >
          {selected ? 'Selected' : 'Choose this plan'}
        </Button>
      </CardFooter>
    </Card>
  )
}
