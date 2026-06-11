'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin, Phone, Clock, ChevronLeft, ChevronRight, CheckCircle,
  ImageIcon, Calendar, Loader2, Building2, ArrowLeft, Shield,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { PlanCard } from '@/components/features/plan-card'
import { EmptyState } from '@/components/features/empty-state'
import { GymMap } from '@/components/features/gym-map'
import { discoveryApi } from '@/lib/api/discovery'
import { subscriptionsApi } from '@/lib/api/subscriptions'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { MembershipPlan, Branch } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function BranchDetailPage() {
  const { id: gymId, branchId } = useParams<{ id: string; branchId: string }>()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [imgIdx, setImgIdx] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null)
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false)

  const { data: gymData, isLoading } = useQuery({
    queryKey: ['gym', gymId],
    queryFn: () => discoveryApi.getGym(gymId),
    enabled: !!gymId,
  })

  const subscribeMutation = useMutation({
    mutationFn: () =>
      subscriptionsApi.createSubscription({
        planId: selectedPlan!.id,
        gymListingId: gymId,
        branchId: branchId,
      }),
    onSuccess: () => {
      toast({ title: 'Subscribed!', description: 'Your membership has been activated.', variant: 'success' })
      setShowSubscribeDialog(false)
      router.push('/subscriptions')
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message ?? 'Failed to create subscription.', variant: 'destructive' })
    },
  })

  const handleSubscribe = (plan: MembershipPlan) => {
    if (!isAuthenticated) {
      router.push(`/auth/login?from=/gyms/${gymId}/branches/${branchId}`)
      return
    }
    setSelectedPlan(plan)
    setShowSubscribeDialog(true)
  }

  const gym = gymData?.data
  const allPlans: MembershipPlan[] = (gym as any)?.membershipPlans ?? []
  const branches: Branch[] = gym?.branches ?? []
  const branch = branches.find((b) => b.id === branchId)

  if (isLoading) {
    return (
      <div className="pt-16 min-h-screen">
        <div className="h-64 bg-slate-800 animate-pulse" />
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!gym || !branch) {
    return (
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <EmptyState
          icon={Building2}
          title="Branch not found"
          description="This branch doesn't exist or is no longer active."
          actionLabel="Back to Gym"
          actionHref={`/gyms/${gymId}`}
        />
      </div>
    )
  }

  const gymWidePlans = allPlans.filter((p) => !p.branchId)
  const branchPlans = [
    ...allPlans.filter((p) => p.branchId === branchId),
    ...gymWidePlans,
  ]

  const branchImages: string[] = Array.isArray((branch as any).imagesJson) ? (branch as any).imagesJson : []
  const facilities: string[] = Array.isArray(branch.facilities)
    ? branch.facilities as string[]
    : Object.keys(branch.facilities as Record<string, boolean> || {}).filter(
        (k) => (branch.facilities as Record<string, boolean>)[k]
      )

  const lat = Number(branch.latitude)
  const lng = Number(branch.longitude)
  const hasMap = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0

  const otherBranches = branches.filter((b) => b.id !== branchId)

  return (
    <div className="pt-16 min-h-screen bg-background">
      {/* ── Hero / Image Banner ── */}
      <div className="relative h-64 sm:h-80 bg-slate-800 overflow-hidden">
        {branchImages.length > 0 ? (
          <>
            {branchImages.map((src, i) => (
              <Image
                key={src}
                src={src}
                alt={`${branch.branchName} — photo ${i + 1}`}
                fill
                priority={i === 0}
                className={cn('object-cover transition-opacity duration-500', i === imgIdx ? 'opacity-80' : 'opacity-0')}
              />
            ))}
            {branchImages.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx((i) => (i - 1 + branchImages.length) % branchImages.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 z-10"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setImgIdx((i) => (i + 1) % branchImages.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 z-10"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {branchImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={cn('h-1.5 rounded-full transition-all', i === imgIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/50')}
                    />
                  ))}
                </div>
                <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 z-10">
                  <ImageIcon className="h-3 w-3" />
                  {imgIdx + 1}/{branchImages.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
            <Building2 className="h-16 w-16 text-slate-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Back navigation */}
        <div className="absolute top-4 left-4 z-10">
          <Link href={`/gyms/${gymId}?tab=branches`}>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-1">
              <ArrowLeft className="h-4 w-4" /> {gym.name}
            </Button>
          </Link>
        </div>

        {/* Branch title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-success/80 text-white border-0 backdrop-blur-sm">Active</Badge>
              {gym.logoUrl && (
                <div className="w-8 h-8 rounded-lg bg-white/20 overflow-hidden backdrop-blur-sm">
                  <Image src={gym.logoUrl} alt={gym.name} width={32} height={32} className="object-contain" />
                </div>
              )}
              <span className="text-white/70 text-sm">{gym.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{branch.branchName}</h1>
            {branch.city && (
              <p className="text-white/80 text-sm mt-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {branch.area?.name ? `${branch.area.name}, ` : ''}{branch.city.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Branch Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {branch.address && (
            <div className="bg-card border rounded-xl p-4 flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Address</p>
                <p className="text-sm font-medium leading-snug">{branch.address}</p>
              </div>
            </div>
          )}
          {branch.phone && (
            <div className="bg-card border rounded-xl p-4 flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                <a href={`tel:${branch.phone}`} className="text-sm font-medium hover:text-primary">{branch.phone}</a>
              </div>
            </div>
          )}
          {branch.openingTime && branch.closingTime && (
            <div className="bg-card border rounded-xl p-4 flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Hours</p>
                <p className="text-sm font-medium">{branch.openingTime} — {branch.closingTime}</p>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        {hasMap && (
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Location
            </h2>
            <div className="rounded-2xl overflow-hidden border shadow-sm relative">
              <GymMap latitude={lat} longitude={lng} title={branch.branchName} className="h-72" />
              <div className="absolute bottom-4 left-4 bg-white dark:bg-card border shadow-md rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-primary" />
                {branch.branchName}
              </div>
            </div>
          </div>
        )}

        {/* Facilities */}
        {facilities.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" /> Facilities
            </h2>
            <div className="flex flex-wrap gap-2">
              {facilities.map((f) => (
                <div key={f} className="flex items-center gap-1.5 text-sm bg-muted px-3 py-2 rounded-full border">
                  <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Membership Plans */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Membership Plans
            </h2>
            <span className="text-sm text-muted-foreground">{branchPlans.length} plan{branchPlans.length !== 1 ? 's' : ''} available</span>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Subscribe to <span className="font-medium text-foreground">{branch.branchName}</span> — select the plan that works for you
          </p>

          {branchPlans.length === 0 ? (
            <div className="text-center py-12 border rounded-2xl bg-muted/30">
              <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No membership plans available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {branchPlans.map((plan, i) => (
                <div key={plan.id} className="relative">
                  {!plan.branchId && (
                    <div className="absolute -top-2.5 left-3 z-10">
                      <span className="text-xs bg-muted border px-2 py-0.5 rounded-full text-muted-foreground">All branches</span>
                    </div>
                  )}
                  <PlanCard
                    plan={plan}
                    highlighted={i === 0 && branchPlans.length >= 2}
                    onSubscribe={handleSubscribe}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Other Branches */}
        {otherBranches.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4">Other Branches</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherBranches.map((b) => {
                const bPlans = [...allPlans.filter((p) => p.branchId === b.id), ...gymWidePlans]
                return (
                  <Link
                    key={b.id}
                    href={`/gyms/${gymId}/branches/${b.id}`}
                    className="group bg-card border rounded-xl p-4 hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">{b.branchName.charAt(0)}</span>
                      </div>
                      <span className="font-semibold text-sm group-hover:text-primary transition-colors">{b.branchName}</span>
                    </div>
                    {b.address && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <MapPin className="h-3 w-3 shrink-0" />{b.address}
                      </p>
                    )}
                    {b.openingTime && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                        <Clock className="h-3 w-3 shrink-0" />{b.openingTime} — {b.closingTime}
                      </p>
                    )}
                    <p className="text-xs text-primary font-medium">
                      {bPlans.length} plan{bPlans.length !== 1 ? 's' : ''} →
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Subscribe Dialog ── */}
      <Dialog open={showSubscribeDialog} onOpenChange={setShowSubscribeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Subscription</DialogTitle>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-4 py-2">
              {/* Branch card */}
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

              {/* Plan summary */}
              <div className="bg-muted rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium capitalize">{selectedPlan.durationValue} {selectedPlan.durationType.toLowerCase()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium text-primary">{formatCurrency(Number(selectedPlan.price))}</span>
                </div>
                {Number(selectedPlan.joiningFee) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Joining Fee</span>
                    <span className="font-medium">{formatCurrency(Number(selectedPlan.joiningFee))}</span>
                  </div>
                )}
                {Number((selectedPlan as any).securityFee) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Security Fee</span>
                    <span className="font-medium">{formatCurrency(Number((selectedPlan as any).securityFee))}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Start Date</span>
                  <span className="font-medium flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />{formatDate(new Date())}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between font-semibold">
                  <span>Total Due Today</span>
                  <span className="text-primary text-lg">
                    {formatCurrency(Number(selectedPlan.price) + Number(selectedPlan.joiningFee) + Number((selectedPlan as any).securityFee ?? 0))}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubscribeDialog(false)}>Cancel</Button>
            <Button loading={subscribeMutation.isPending} onClick={() => subscribeMutation.mutate()}>
              Confirm Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
