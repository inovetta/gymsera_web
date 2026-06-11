'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CheckCircle, Dumbbell, MapPin, Star, TrendingUp, Users, Building2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { GymCard } from '@/components/features/gym-card'
import { SearchBar } from '@/components/features/search-bar'
import { discoveryApi } from '@/lib/api/discovery'
import { City } from '@/types'
import { cn } from '@/lib/utils'

const howItWorksSteps = [
  {
    icon: MapPin,
    title: 'Find a Gym',
    description: 'Browse hundreds of gyms in your city. Filter by location, gender, price, and ratings.',
    color: 'bg-blue-500',
  },
  {
    icon: Dumbbell,
    title: 'Choose a Plan',
    description: 'Pick a membership plan that fits your schedule and budget. Daily, weekly, or monthly.',
    color: 'bg-primary',
  },
  {
    icon: TrendingUp,
    title: 'Start Working Out',
    description: 'Get your QR code and walk into any gym location. Track your progress over time.',
    color: 'bg-green-500',
  },
]

const ownerBenefits = [
  'Easy member management dashboard',
  'QR code check-in system',
  'Payment tracking & invoices',
  'Multiple branch support',
  'Analytics & reports',
  'Trainer management',
]

export default function HomePage() {
  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['featured-gyms'],
    queryFn: () => discoveryApi.getFeaturedGyms(),
  })

  const { data: topRatedData, isLoading: topRatedLoading } = useQuery({
    queryKey: ['top-rated-gyms'],
    queryFn: () => discoveryApi.getTopRatedGyms(),
  })

  const { data: citiesData, isLoading: citiesLoading } = useQuery({
    queryKey: ['cities'],
    queryFn: () => discoveryApi.getCities(),
  })

  const featuredGyms = featuredData?.data?.gyms || []
  const topRatedGyms = topRatedData?.data?.gyms || []
  const cities = citiesData?.data?.cities?.filter((c) => c.isActive !== false) || []

  return (
    <div className="overflow-x-hidden">
      {/* HERO SECTION */}
      <section className="hero-gradient min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Decorative blobs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-white/80 text-sm mb-8">
            <Star className="h-3.5 w-3.5 text-warning fill-warning" />
            Pakistan&apos;s fastest growing gym network
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
            Find Your{' '}
            <span className="text-gradient">Perfect Gym</span>
          </h1>

          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover and join the best gyms in your city. Browse facilities, compare plans, and start your fitness journey today.
          </p>

          {/* Search Bar */}
          <SearchBar className="max-w-3xl mx-auto mb-12" />

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
            {[
              { value: '500+', label: 'Gyms Listed' },
              { value: '50K+', label: 'Active Members' },
              { value: '100+', label: 'Cities Covered' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-white/60 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center pt-2">
            <div className="w-1.5 h-2.5 bg-white/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* FEATURED GYMS */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-primary font-semibold text-sm mb-2 uppercase tracking-wider">Handpicked</p>
              <h2 className="text-3xl font-bold">Featured Gyms</h2>
              <p className="text-muted-foreground mt-2">Top gyms selected for quality and experience</p>
            </div>
            <Link href="/gyms?featured=true" className="hidden sm:flex items-center gap-1 text-primary font-medium hover:gap-2 transition-all">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border overflow-hidden">
                  <Skeleton className="h-48" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredGyms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredGyms.slice(0, 6).map((gym) => (
                <GymCard key={gym.id} gym={gym} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No featured gyms at the moment
            </div>
          )}
        </div>
      </section>

      {/* CITIES */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary font-semibold text-sm mb-2 uppercase tracking-wider">Explore</p>
            <h2 className="text-3xl font-bold">Browse by City</h2>
            <p className="text-muted-foreground mt-2">Find gyms in your city across Pakistan</p>
          </div>

          {citiesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : cities.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {cities.slice(0, 8).map((city) => (
                <CityCard key={city.id} city={city} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">No cities available</div>
          )}

          <div className="text-center mt-8">
            <Link href="/gyms">
              <Button variant="outline" size="lg" className="gap-2">
                Browse All Gyms <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold text-sm mb-2 uppercase tracking-wider">Simple Process</p>
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="text-muted-foreground mt-2">Join a gym in minutes, not days</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step, index) => (
              <div key={step.title} className="relative text-center">
                {index < howItWorksSteps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-2/3 w-full h-0.5 bg-gradient-to-r from-border to-transparent z-0" />
                )}
                <div className="relative z-10">
                  <div className={cn('w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6', step.color)}>
                    <step.icon className="h-10 w-10 text-white" />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center mx-auto -mt-3 mb-4 relative z-10 border-2 border-background">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TOP RATED */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-primary font-semibold text-sm mb-2 uppercase tracking-wider">Top Picks</p>
              <h2 className="text-3xl font-bold">Most Popular Gyms</h2>
              <p className="text-muted-foreground mt-2">Highest rated by our members</p>
            </div>
            <Link href="/gyms?sortBy=rating" className="hidden sm:flex items-center gap-1 text-primary font-medium hover:gap-2 transition-all">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {topRatedLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border overflow-hidden">
                  <Skeleton className="h-48" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : topRatedGyms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {topRatedGyms.slice(0, 6).map((gym) => (
                <GymCard key={gym.id} gym={gym} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* GYM OWNERS CTA */}
      <section className="py-20 px-4 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-primary font-semibold text-sm mb-3 uppercase tracking-wider">For Gym Owners</p>
              <h2 className="text-4xl font-bold text-white mb-6">
                Grow Your Gym Business with GymsEra
              </h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Join hundreds of gym owners using GymsEra to manage members, track payments, and grow their business.
              </p>
              <ul className="space-y-3 mb-8">
                {ownerBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle className="h-5 w-5 text-success shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link href="/for-gym-owners">
                  <Button size="lg" className="gap-2">
                    List Your Gym <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/onboarding">
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    Start Onboarding
                  </Button>
                </Link>
              </div>
            </div>

            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                { icon: Users, label: 'Members Managed', value: '50K+' },
                { icon: Building2, label: 'Active Gyms', value: '500+' },
                { icon: TrendingUp, label: 'Revenue Tracked', value: '₨2M+' },
                { icon: Star, label: 'Avg Rating', value: '4.8' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                  <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-16 px-4 bg-background border-t">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">Stay Updated</h2>
          <p className="text-muted-foreground mb-6">Get notified about new gyms, special offers, and fitness tips.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 h-11 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button className="shrink-0">Subscribe</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">No spam, unsubscribe anytime.</p>
        </div>
      </section>
    </div>
  )
}

function CityCard({ city }: { city: City }) {
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-rose-600',
    'from-purple-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-blue-600',
  ]
  const gradient = colors[city.id % colors.length]

  return (
    <Link href={`/gyms?cityId=${city.id}`}>
      <div className={cn('bg-gradient-to-br rounded-xl p-6 cursor-pointer group card-hover text-white', gradient)}>
        <Building2 className="h-8 w-8 mb-3 opacity-80" />
        <h3 className="font-bold text-lg">{city.name}</h3>
        {city.gymCount !== undefined && (
          <p className="text-sm text-white/70 mt-1">{city.gymCount} gyms</p>
        )}
        <ArrowRight className="h-4 w-4 mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  )
}
