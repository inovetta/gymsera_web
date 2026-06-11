'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, X, Navigation, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { GymCard } from '@/components/features/gym-card'
import { EmptyState } from '@/components/features/empty-state'
import { discoveryApi } from '@/lib/api/discovery'
import { useDebounce } from '@/hooks/use-debounce'

export default function GymsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [cityId, setCityId] = useState(searchParams.get('cityId') || '')
  const [areaId, setAreaId] = useState('')
  const [genderType, setGenderType] = useState(searchParams.get('genderType') || '')
  const [minRating, setMinRating] = useState('')
  const [featured, setFeatured] = useState(searchParams.get('featured') === 'true')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || '')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [nearbyMode, setNearbyMode] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)

  const debouncedSearch = useDebounce(search, 400)

  const { data: citiesData } = useQuery({
    queryKey: ['cities'],
    queryFn: () => discoveryApi.getCities(),
  })

  const cities = citiesData?.data?.cities || []
  const selectedCity = cities.find((c) => String(c.id) === cityId)
  const areas = selectedCity?.areas || []

  const queryParams = {
    search: debouncedSearch || undefined,
    cityId: cityId ? Number(cityId) : undefined,
    areaId: areaId ? Number(areaId) : undefined,
    genderType: genderType || undefined,
    minRating: minRating ? Number(minRating) : undefined,
    featured: featured || undefined,
    sortBy: (sortBy as 'rating' | 'price' | 'newest') || undefined,
    page,
    limit: 12,
  }

  const { data: gymsData, isLoading } = useQuery({
    queryKey: ['gyms', queryParams],
    queryFn: () => discoveryApi.getGyms(queryParams),
    placeholderData: (prev) => prev,
    enabled: !nearbyMode,
  })

  const { data: nearbyData, isLoading: nearbyLoading } = useQuery({
    queryKey: ['gyms-nearby', userCoords?.lat, userCoords?.lng],
    queryFn: () => discoveryApi.getNearbyGyms(userCoords!.lat, userCoords!.lng),
    enabled: nearbyMode && !!userCoords,
    placeholderData: (prev) => prev,
  })

  const gyms = nearbyMode ? (nearbyData?.data?.gyms || []) : (gymsData?.data?.gyms || [])
  const pagination = nearbyMode ? undefined : gymsData?.pagination

  const handleNearMe = () => {
    if (nearbyMode) {
      setNearbyMode(false)
      setUserCoords(null)
      return
    }
    if (!navigator.geolocation) return
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setNearbyMode(true)
        setLocationLoading(false)
      },
      () => setLocationLoading(false),
      { timeout: 8000 },
    )
  }

  const hasActiveFilters = cityId || genderType || minRating || featured || sortBy

  const clearFilters = () => {
    setCityId('')
    setAreaId('')
    setGenderType('')
    setMinRating('')
    setFeatured(false)
    setSortBy('')
    setPage(1)
  }

  return (
    <div className="pt-16">
      {/* Page Header */}
      <div className="bg-slate-900 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Find Your Gym</h1>
          <p className="text-slate-400">Discover the perfect gym for your fitness journey</p>
          {nearbyMode ? (
            <p className="text-sm text-slate-400 mt-3 flex items-center gap-1.5">
              <Navigation className="h-3.5 w-3.5" />
              Showing {gyms.length} gyms near you
            </p>
          ) : pagination ? (
            <p className="text-sm text-slate-400 mt-3">
              Showing {gyms.length} of {pagination.total} gyms
            </p>
          ) : null}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search + Sort Row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search gyms..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-10"
            />
          </div>

          <Select value={sortBy} onValueChange={(v) => { setSortBy(v === 'none' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Default</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
              <SelectItem value="price">Lowest Price</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={nearbyMode ? 'default' : 'outline'}
            className="gap-2 shrink-0"
            onClick={handleNearMe}
            disabled={locationLoading}
          >
            {locationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
            {nearbyMode ? 'Near Me ✓' : 'Near Me'}
          </Button>

          <Button
            variant="outline"
            className="gap-2 shrink-0"
            onClick={() => setShowFilters(!showFilters)}
            disabled={nearbyMode}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">!</Badge>}
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-card border rounded-xl p-5 mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Filters</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                  <X className="h-3 w-3" /> Clear all
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* City */}
              <div>
                <Label className="mb-2 block">City</Label>
                <Select value={cityId} onValueChange={(v) => { setCityId(v === 'all' ? '' : v); setAreaId(''); setPage(1) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={String(city.id)}>{city.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Area */}
              {areas.length > 0 && (
                <div>
                  <Label className="mb-2 block">Area</Label>
                  <Select value={areaId} onValueChange={(v) => { setAreaId(v === 'all' ? '' : v); setPage(1) }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All areas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Areas</SelectItem>
                      {areas.map((area) => (
                        <SelectItem key={area.id} value={String(area.id)}>{area.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Gender */}
              <div>
                <Label className="mb-2 block">Gender</Label>
                <Select value={genderType} onValueChange={(v) => { setGenderType(v === 'all' ? '' : v); setPage(1) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="MIXED">Mixed</SelectItem>
                    <SelectItem value="MALE">Men Only</SelectItem>
                    <SelectItem value="FEMALE">Women Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Min Rating */}
              <div>
                <Label className="mb-2 block">Min Rating</Label>
                <Select value={minRating} onValueChange={(v) => { setMinRating(v === 'all' ? '' : v); setPage(1) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Rating</SelectItem>
                    <SelectItem value="3">3+ Stars</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Switch
                id="featured"
                checked={featured}
                onCheckedChange={(v) => { setFeatured(v); setPage(1) }}
              />
              <Label htmlFor="featured">Featured gyms only</Label>
            </div>
          </div>
        )}

        {/* Results */}
        {(isLoading || nearbyLoading) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
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
        ) : gyms.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No gyms found"
            description="Try adjusting your search filters or search in a different city."
            actionLabel="Clear Filters"
            onAction={clearFilters}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {gyms.map((gym) => (
                <GymCard key={gym.id} gym={gym} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(pagination.totalPages, 7) }).map((_, i) => {
                    const pageNum = i + 1
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                          page === pageNum
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === pagination.totalPages}
                  className="gap-1"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
