'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Pause, X, RefreshCw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { SubscriptionCard } from '@/components/features/subscription-card'
import { EmptyState } from '@/components/features/empty-state'
import { meApi } from '@/lib/api/me'
import { subscriptionsApi } from '@/lib/api/subscriptions'
import { useToast } from '@/hooks/use-toast'
import { MemberSubscription } from '@/types'

export default function SubscriptionsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState('')
  const [freezingId, setFreezingId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [freezeFrom, setFreezeFrom] = useState('')
  const [freezeTo, setFreezeTo] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['my-subscriptions', statusFilter],
    queryFn: () => meApi.getSubscriptions({ status: statusFilter || undefined, limit: 50 }),
  })

  const freezeMutation = useMutation({
    mutationFn: (id: string) => subscriptionsApi.freezeSubscription(id, { freezeFrom, freezeTo }),
    onSuccess: () => {
      toast({ title: 'Subscription frozen', variant: 'success' })
      setFreezingId(null)
      queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] })
    },
    onError: () => toast({ title: 'Failed to freeze', variant: 'destructive' }),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => subscriptionsApi.cancelSubscription(id),
    onSuccess: () => {
      toast({ title: 'Subscription cancelled', variant: 'success' })
      setCancellingId(null)
      queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] })
    },
    onError: () => toast({ title: 'Failed to cancel', variant: 'destructive' }),
  })

  const renewMutation = useMutation({
    mutationFn: (id: string) => subscriptionsApi.renewSubscription(id),
    onSuccess: () => {
      toast({ title: 'Subscription renewed!', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] })
    },
    onError: () => toast({ title: 'Failed to renew', variant: 'destructive' }),
  })

  const subscriptions = data?.data?.memberships || []

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Subscriptions</h1>
          <p className="text-muted-foreground mt-1">Manage your gym memberships</p>
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="FROZEN">Frozen</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : subscriptions.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No subscriptions yet"
          description="Join a gym to start your fitness journey. Browse our listed gyms and pick a membership plan."
          actionLabel="Find a Gym"
          actionHref="/gyms"
        />
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              onFreeze={(id) => { setFreezingId(id); setFreezeFrom(''); setFreezeTo('') }}
              onCancel={(id) => setCancellingId(id)}
              onRenew={(id) => renewMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Freeze Dialog */}
      <Dialog open={!!freezingId} onOpenChange={(open) => !open && setFreezingId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Freeze Subscription</DialogTitle>
            <DialogDescription>Select the date range to freeze your membership.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="mb-2 block">Freeze From</Label>
              <input
                type="date"
                value={freezeFrom}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFreezeFrom(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <Label className="mb-2 block">Freeze Until</Label>
              <input
                type="date"
                value={freezeTo}
                min={freezeFrom || new Date().toISOString().split('T')[0]}
                onChange={(e) => setFreezeTo(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFreezingId(null)}>Cancel</Button>
            <Button
              onClick={() => freezingId && freezeMutation.mutate(freezingId)}
              loading={freezeMutation.isPending}
              disabled={!freezeFrom || !freezeTo}
            >
              <Pause className="h-4 w-4 mr-2" />
              Freeze
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancellingId} onOpenChange={(open) => !open && setCancellingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel your subscription. You&apos;ll still have access until the end of your billing period. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => cancellingId && cancelMutation.mutate(cancellingId)}
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Yes, Cancel'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
