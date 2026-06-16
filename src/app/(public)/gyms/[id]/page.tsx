'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin, Phone, Mail, Clock, Star, Users, ChevronLeft, ChevronRight, MessageSquare,
  CheckCircle, Calendar, Loader2, Building2, ImageIcon, Shield, Search, ArrowRight,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { PlanCard } from '@/components/features/plan-card'
import { ReviewCard } from '@/components/features/review-card'
import { StarRating } from '@/components/features/star-rating'
import { EmptyState } from '@/components/features/empty-state'
import { GymMap } from '@/components/features/gym-map'
import { discoveryApi } from '@/lib/api/discovery'
import { subscriptionsApi } from '@/lib/api/subscriptions'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { MembershipPlan, Branch } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function GymDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'overview')
  const [branchSearch, setBranchSearch] = useState('')
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewBody, setReviewBody] = useState('')
  const [reviewPage, setReviewPage] = useState(1)
  const [heroIndex, setHeroIndex] = useState(0)

  const { data: gymData, isLoading: gymLoading } = useQuery({
    queryKey: ['gym', id],
    queryFn: () => discoveryApi.getGym(id),
    enabled: !!id,
  })

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['gym-reviews', id, reviewPage],
    queryFn: () => discoveryApi.getGymReviews(id, { page: reviewPage, limit: 10 }),
    enabled: !!id,
  })

  const subscribeMutation = useMutation({
    mutationFn: () =>
      subscriptionsApi.createSubscription({
        planId: selectedPlan!.id,
        gymListingId: id,
        branchId: selectedBranch!.id,
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

  const reviewMutation = useMutation({
    mutationFn: () =>
      discoveryApi.submitReview(id, { rating: reviewRating, title: reviewTitle, body: reviewBody }),
    onSuccess: () => {
      toast({ title: 'Review submitted!', description: 'Your review is pending approval.', variant: 'success' })
      setShowReviewDialog(false)
      queryClient.invalidateQueries({ queryKey: ['gym-reviews', id] })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to submit review.', variant: 'destructive' })
    },
  })

  const gym = gymData?.data
  // Plans come embedded inside gym.branches context; also available gym-level
  const allPlans: MembershipPlan[] = (gym as any)?.membershipPlans ?? []
  const reviews = reviewsData?.data?.reviews || []
  const reviewPagination = reviewsData?.pagination

  const handleSubscribe = (plan: MembershipPlan, branch: Branch) => {
    if (!isAuthenticated) {
      router.push(`/auth/login?from=/gyms/${id}`)
      return
    }
    setSelectedPlan(plan)
    setSelectedBranch(branch)
    setShowSubscribeDialog(true)
  }

  if (gymLoading) {
    return (
      <div className="pt-16">
        <Skeleton className="h-72 w-full" />
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  if (!gym) {
    return (
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <EmptyState title="Gym not found" description="The gym you're looking for doesn't exist." actionLabel="Browse Gyms" actionHref="/gyms" />
      </div>
    )
  }

  const heroImages: string[] = Array.isArray(gym.imagesJson) && gym.imagesJson.length > 0
    ? gym.imagesJson
    : gym.coverImageUrl ? [gym.coverImageUrl] : []
  const hasMultipleHero = heroImages.length > 1

  const branches: Branch[] = gym.branches ?? []

  // Gym-wide plans (not tied to any branch)
  const gymWidePlans = allPlans.filter((p) => !p.branchId)

  // Plans for a specific branch (branch-specific + gym-wide)
  const plansForBranch = (branchId: string) => [
    ...allPlans.filter((p) => p.branchId === branchId),
    ...gymWidePlans,
  ]

  return (
    <div className="pt-16">
      {/* ── Hero ── */}
      <div className="relative h-72 sm:h-96 bg-slate-800 overflow-hidden">
        {heroImages.length > 0 ? (
          heroImages.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt={`${gym.name} — photo ${i + 1}`}
              fill
              priority={i === 0}
              className={cn('object-cover transition-opacity duration-500', i === heroIndex ? 'opacity-80' : 'opacity-0')}
            />
          ))
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {hasMultipleHero && (
          <>
            <button onClick={() => setHeroIndex((i) => (i - 1 + heroImages.length) % heroImages.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 z-10">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => setHeroIndex((i) => (i + 1) % heroImages.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 z-10">
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {heroImages.map((_, i) => (
                <button key={i} onClick={() => setHeroIndex(i)}
                  className={cn('h-1.5 rounded-full transition-all', i === heroIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50')} />
              ))}
            </div>
          </>
        )}

        <div className="absolute top-4 left-4">
          <Link href="/gyms">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-1">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-6xl mx-auto flex items-end gap-4">
            {gym.logoUrl && (
              <div className="w-20 h-20 rounded-2xl bg-white shadow-lg overflow-hidden border-4 border-white shrink-0">
                <Image src={gym.logoUrl} alt={`${gym.name} logo`} width={80} height={80} className="object-contain p-1" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  {gym.genderType === 'MALE' ? 'Men Only' : gym.genderType === 'FEMALE' ? 'Women Only' : 'Mixed'}
                </Badge>
                {gym.featured && <Badge className="bg-primary text-white">Featured</Badge>}
              </div>
              <h1 className="text-3xl font-bold text-white">{gym.name}</h1>
              {gym.city && (
                <div className="flex items-center gap-1 text-white/80 mt-1 text-sm">
                  <MapPin className="h-3.5 w-3.5" />
                  {gym.area?.name ? `${gym.area.name}, ` : ''}{gym.city.name}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Stats Bar ── */}
      <div className="bg-card border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-warning fill-warning" />
              <span className="font-bold">{(Number(gym.averageRating) || 0).toFixed(1)}</span>
              <span className="text-muted-foreground text-sm">({gym.totalReviews || 0} reviews)</span>
            </div>
            {branches.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                {branches.length} {branches.length === 1 ? 'Branch' : 'Branches'}
              </div>
            )}
            {gym.genderType && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {gym.genderType === 'MIXED' ? 'Mixed Gender' : gym.genderType === 'MALE_ONLY' ? 'Men Only' : 'Women Only'}
              </div>
            )}
            {allPlans.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                {allPlans.length} plan{allPlans.length !== 1 ? 's' : ''} available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="branches">
              Branches & Plans
              {branches.length > 0 && (
                <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{branches.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews
              {(gym.totalReviews ?? 0) > 0 && (
                <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{gym.totalReviews}</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ── */}
          <TabsContent value="overview" className="space-y-8">
            {gym.description && (
              <div>
                <h2 className="text-xl font-bold mb-3">About</h2>
                <p className="text-muted-foreground leading-relaxed">{gym.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {(gym.phone || gym.email || gym.openingTime) && (
                <div className="bg-card border rounded-xl p-5">
                  <h3 className="font-semibold mb-4">Contact</h3>
                  <div className="space-y-3">
                    {gym.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <a href={`tel:${gym.phone}`} className="hover:text-primary">{gym.phone}</a>
                      </div>
                    )}
                    {gym.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <a href={`mailto:${gym.email}`} className="hover:text-primary">{gym.email}</a>
                      </div>
                    )}
                    {gym.openingTime && gym.closingTime && (
                      <div className="flex items-center gap-3 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{gym.openingTime} — {gym.closingTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {gym.facilities && gym.facilities.length > 0 && (
                <div className="bg-card border rounded-xl p-5">
                  <h3 className="font-semibold mb-4">Facilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {gym.facilities.map((f) => (
                      <div key={f} className="flex items-center gap-1.5 text-sm bg-muted px-3 py-1.5 rounded-full">
                        <CheckCircle className="h-3.5 w-3.5 text-success" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Gym gallery */}
            {gym.images && gym.images.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Gallery</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {gym.images.map((img, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden">
                      <Image src={img} alt={`${gym.name} image ${i + 1}`} width={300} height={300} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Branch teaser */}
            {branches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Our Branches</h2>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('branches')}>
                    View all {branches.length} branches
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {branches.slice(0, 3).map((branch) => {
                    const coverImage = Array.isArray((branch as any).imagesJson) && (branch as any).imagesJson.length > 0
                      ? (branch as any).imagesJson[0]
                      : null
                    return (
                      <Link
                        key={branch.id}
                        href={`/gyms/${id}/branches/${branch.id}`}
                        className="group bg-card border rounded-xl overflow-hidden hover:border-primary hover:shadow-md transition-all"
                      >
                        {coverImage && (
                          <div className="relative h-28 overflow-hidden">
                            <Image src={coverImage} alt={branch.branchName} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            {!coverImage && (
                              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-primary">{branch.branchName.charAt(0)}</span>
                              </div>
                            )}
                            <span className="font-semibold text-sm">{branch.branchName}</span>
                          </div>
                          {branch.address && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                              <MapPin className="h-3 w-3 shrink-0" /><span className="line-clamp-1">{branch.address}</span>
                            </p>
                          )}
                          {branch.openingTime && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                              <Clock className="h-3 w-3 shrink-0" />{branch.openingTime} — {branch.closingTime}
                            </p>
                          )}
                          <p className="text-xs text-primary font-medium flex items-center gap-1">
                            {plansForBranch(branch.id).length} plan{plansForBranch(branch.id).length !== 1 ? 's' : ''} <ArrowRight className="h-3 w-3" />
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Branches Tab ── */}
          <TabsContent value="branches">
            {branches.length === 0 ? (
              <EmptyState icon={Building2} title="No branches yet" description="This gym hasn't set up any branches." />
            ) : (
              <div className="space-y-6">
                {/* Search bar — only shown when there are enough branches */}
                {branches.length > 4 && (
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search branches..."
                      value={branchSearch}
                      onChange={(e) => setBranchSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                )}

                {/* Branch Cards Grid */}
                {(() => {
                  const filtered = branches.filter((b) =>
                    !branchSearch || b.branchName.toLowerCase().includes(branchSearch.toLowerCase()) ||
                    b.address?.toLowerCase().includes(branchSearch.toLowerCase()) ||
                    b.city?.name?.toLowerCase().includes(branchSearch.toLowerCase())
                  )

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 border rounded-2xl bg-muted/30">
                        <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No branches match your search.</p>
                      </div>
                    )
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filtered.map((branch) => {
                        const branchImages: string[] = Array.isArray((branch as any).imagesJson) ? (branch as any).imagesJson : []
                        const branchPlans = plansForBranch(branch.id)
                        const coverImage = branchImages[0] ?? null

                        return (
                          <Link
                            key={branch.id}
                            href={`/gyms/${id}/branches/${branch.id}`}
                            className="group bg-card border rounded-2xl overflow-hidden hover:border-primary hover:shadow-lg transition-all duration-200"
                          >
                            {/* Branch cover image or placeholder */}
                            <div className="relative h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              {coverImage ? (
                                <Image
                                  src={coverImage}
                                  alt={branch.branchName}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Building2 className="h-10 w-10 text-muted-foreground/40" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                              {/* Status + image count badges */}
                              <div className="absolute top-3 left-3 flex gap-1.5">
                                <Badge className="bg-success/90 text-white border-0 text-xs">Active</Badge>
                              </div>
                              {branchImages.length > 1 && (
                                <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                                  <ImageIcon className="h-3 w-3" />
                                  {branchImages.length}
                                </div>
                              )}

                              {/* Branch name on image */}
                              <div className="absolute bottom-3 left-3 right-3">
                                <h3 className="text-white font-bold text-base leading-tight">{branch.branchName}</h3>
                                {branch.city && (
                                  <p className="text-white/80 text-xs mt-0.5">
                                    {branch.area?.name ? `${branch.area.name}, ` : ''}{branch.city.name}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Branch details */}
                            <div className="p-4 space-y-2">
                              {branch.address && (
                                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                                  <span className="line-clamp-1">{branch.address}</span>
                                </p>
                              )}
                              {branch.openingTime && branch.closingTime && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
                                  {branch.openingTime} — {branch.closingTime}
                                </p>
                              )}
                              {branch.phone && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                  <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                                  {branch.phone}
                                </p>
                              )}

                              {/* Footer: plans count + CTA */}
                              <div className="flex items-center justify-between pt-2 border-t mt-3">
                                <span className="text-xs font-medium text-primary flex items-center gap-1">
                                  <Shield className="h-3.5 w-3.5" />
                                  {branchPlans.length} plan{branchPlans.length !== 1 ? 's' : ''}
                                </span>
                                <span className="text-xs font-semibold text-primary group-hover:gap-2 flex items-center gap-1 transition-all">
                                  View & Subscribe <ArrowRight className="h-3.5 w-3.5" />
                                </span>
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            )}
          </TabsContent>

          {/* ── Reviews Tab ── */}
          <TabsContent value="reviews">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Member Reviews</h2>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating rating={gym.averageRating} showValue />
                  <span className="text-sm text-muted-foreground">({gym.totalReviews || 0} reviews)</span>
                </div>
              </div>
              <Button onClick={() => {
                if (!isAuthenticated) { router.push(`/auth/login?from=/gyms/${id}`); return }
                setShowReviewDialog(true)
              }} className="gap-2">
                <MessageSquare className="h-4 w-4" /> Write Review
              </Button>
            </div>

            {reviewsLoading ? (
              <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
            ) : reviews.length === 0 ? (
              <EmptyState icon={MessageSquare} title="No reviews yet" description="Be the first to review this gym!" actionLabel="Write a Review" onAction={() => setShowReviewDialog(true)} />
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
                {reviewPagination && reviewPagination.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <Button variant="outline" size="sm" disabled={reviewPage === 1} onClick={() => setReviewPage((p) => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={reviewPage === reviewPagination.totalPages} onClick={() => setReviewPage((p) => p + 1)}>Next</Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Subscribe Confirmation Dialog ── */}
      <Dialog open={showSubscribeDialog} onOpenChange={setShowSubscribeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Subscription</DialogTitle>
          </DialogHeader>

          {selectedPlan && selectedBranch && (
            <div className="space-y-4 py-2">
              {/* Branch card */}
              <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{selectedBranch.branchName.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{selectedBranch.branchName}</p>
                  {selectedBranch.address && (
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 shrink-0" />{selectedBranch.address}
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
                  <span className="text-muted-foreground">Monthly Price</span>
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
                  <span className="font-medium flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(new Date())}</span>
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

      {/* ── Review Dialog ── */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="mb-2 block">Your Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setReviewRating(star)} className="p-1">
                    <Star className={cn('h-7 w-7 transition-colors', star <= reviewRating ? 'text-warning fill-warning' : 'text-muted-foreground')} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="review-title" className="mb-2 block">Title</Label>
              <input
                id="review-title"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Summarize your experience"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <Label htmlFor="review-body" className="mb-2 block">Review</Label>
              <Textarea
                id="review-body"
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
                placeholder="Share your experience..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>Cancel</Button>
            <Button loading={reviewMutation.isPending} disabled={!reviewTitle || !reviewBody} onClick={() => reviewMutation.mutate()}>
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
