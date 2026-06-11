'use client'

import { Check, Zap } from 'lucide-react'
import { MembershipPlan } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { formatCurrency, formatDuration } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PlanCardProps {
  plan: MembershipPlan
  onSubscribe?: (plan: MembershipPlan) => void
  highlighted?: boolean
}

const defaultFeatures = [
  'Full gym access',
  'Locker room access',
  'Free parking',
]

export function PlanCard({ plan, onSubscribe, highlighted = false }: PlanCardProps) {
  const features = plan.features?.length ? plan.features : defaultFeatures

  return (
    <Card className={cn(
      'relative flex flex-col transition-all duration-300',
      highlighted
        ? 'border-primary shadow-lg shadow-primary/20 scale-105'
        : 'hover:border-primary/50 hover:shadow-md'
    )}>
      {plan.isTrial && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1">
            <Zap className="h-3 w-3 mr-1" />
            Trial Plan
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg">{plan.name}</h3>
            {plan.description && (
              <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-primary">{formatCurrency(Number(plan.price))}</span>
            <span className="text-muted-foreground text-sm">/{formatDuration(plan.durationType, plan.durationValue)}</span>
          </div>
          {Number(plan.joiningFee) > 0 && (
            <p className="text-xs text-muted-foreground mt-1">+ {formatCurrency(Number(plan.joiningFee))} joining fee</p>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-2">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Check className="h-3 w-3 text-primary" />
              </div>
              {feature}
            </li>
          ))}
          {plan.visitLimit && (
            <li className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Check className="h-3 w-3 text-primary" />
              </div>
              Up to {plan.visitLimit} visits
            </li>
          )}
          {plan.freezeLimitDays > 0 && (
            <li className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Check className="h-3 w-3 text-primary" />
              </div>
              Freeze up to {plan.freezeLimitDays} days
            </li>
          )}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={highlighted ? 'default' : 'outline'}
          onClick={() => onSubscribe?.(plan)}
        >
          {plan.isTrial ? 'Start Free Trial' : 'Subscribe Now'}
        </Button>
      </CardFooter>
    </Card>
  )
}
