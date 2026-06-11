'use client'

import { useState } from 'react'
import { Calendar, QrCode, Pause, X, RefreshCw, MapPin } from 'lucide-react'
import { MemberSubscription } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getStatusColor, formatDate, formatDuration } from '@/lib/utils'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SubscriptionCardProps {
  subscription: MemberSubscription
  onFreeze?: (id: string) => void
  onCancel?: (id: string) => void
  onRenew?: (id: string) => void
  onViewQR?: (subscription: MemberSubscription) => void
}

const statusColors: Record<string, string> = {
  ACTIVE: 'success',
  FROZEN: 'warning',
  EXPIRED: 'secondary',
  CANCELLED: 'secondary',
  PENDING: 'warning',
}

export function SubscriptionCard({ subscription, onFreeze, onCancel, onRenew, onViewQR }: SubscriptionCardProps) {
  // subscriptionId is the tenant DB MemberSubscription UUID (from UserGymMembership.subscriptionId).
  // Fall back to id for responses that are already MemberSubscription records.
  const tenantSubId = subscription.subscriptionId ?? subscription.id
  const plan = subscription.membershipPlan
  const branch = subscription.branch
  const status = subscription.status

  const isActive = status === 'ACTIVE'
  const isFrozen = status === 'FROZEN'
  const isExpired = status === 'EXPIRED'
  const isCancelled = status === 'CANCELLED'

  const daysLeft = Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  return (
    <Card className={cn('overflow-hidden', isActive && 'border-success/30')}>
      {isActive && <div className="h-1 bg-gradient-to-r from-success to-emerald-400" />}
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base">{plan?.name || subscription.planName || 'Membership Plan'}</h3>
              <Badge variant={statusColors[status] as 'success' | 'warning' | 'secondary' || 'secondary'}>
                {status}
              </Badge>
            </div>
            {(branch || subscription.gymName) && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {branch?.branchName ?? subscription.gymName}
              </div>
            )}
          </div>
          {plan && (
            <div className="text-right">
              <p className="font-semibold text-primary">
                {formatDuration(plan.durationType, plan.durationValue)}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Start Date</p>
            <p className="text-sm font-medium">{formatDate(subscription.startDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">End Date</p>
            <p className="text-sm font-medium">{formatDate(subscription.endDate)}</p>
          </div>
          {isActive && (
            <div>
              <p className="text-xs text-muted-foreground">Days Remaining</p>
              <p className={cn('text-sm font-semibold', daysLeft <= 7 ? 'text-warning' : 'text-success')}>
                {daysLeft} days
              </p>
            </div>
          )}
          {subscription.remainingVisits !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground">Visits Left</p>
              <p className="text-sm font-semibold">{subscription.remainingVisits}</p>
            </div>
          )}
        </div>

        {isFrozen && subscription.freezeFrom && subscription.freezeTo && (
          <div className="bg-warning/10 text-warning text-xs rounded-md p-2 mb-3">
            Frozen: {formatDate(subscription.freezeFrom)} – {formatDate(subscription.freezeTo)}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {(isActive || isFrozen) && (
            <Link href={`/subscriptions/${tenantSubId}`}>
              <Button size="sm" variant="outline" className="gap-1">
                <QrCode className="h-3 w-3" />
                QR Code
              </Button>
            </Link>
          )}
          {isActive && onFreeze && (
            <Button size="sm" variant="outline" className="gap-1" onClick={() => onFreeze(tenantSubId)}>
              <Pause className="h-3 w-3" />
              Freeze
            </Button>
          )}
          {isExpired && onRenew && (
            <Button size="sm" className="gap-1" onClick={() => onRenew(tenantSubId)}>
              <RefreshCw className="h-3 w-3" />
              Renew
            </Button>
          )}
          {(isActive || isFrozen) && onCancel && (
            <Button size="sm" variant="ghost" className="gap-1 text-destructive hover:text-destructive" onClick={() => onCancel(tenantSubId)}>
              <X className="h-3 w-3" />
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
