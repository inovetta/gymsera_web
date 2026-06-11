import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Users } from 'lucide-react'
import { GymListing } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StarRating } from './star-rating'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface GymCardProps {
  gym: GymListing
  className?: string
}

const genderBadgeVariant = {
  MALE: 'secondary' as const,
  FEMALE: 'secondary' as const,
  MIXED: 'outline' as const,
}

const genderLabel = {
  MALE: 'Men Only',
  FEMALE: 'Women Only',
  MIXED: 'Mixed',
}

export function GymCard({ gym, className }: GymCardProps) {
  const gradientColors = [
    'from-orange-500 to-rose-600',
    'from-blue-500 to-indigo-600',
    'from-green-500 to-emerald-600',
    'from-purple-500 to-pink-600',
    'from-amber-500 to-orange-600',
  ]
  const gradient = gradientColors[(gym.name?.charCodeAt(0) ?? 0) % gradientColors.length]

  return (
    <Link href={`/gyms/${gym.id}`} className={cn('group bg-card rounded-xl border overflow-hidden card-hover block', className)}>
      {/* Cover Image */}
      <div className="relative h-48 overflow-hidden">
        {gym.coverImageUrl ? (
          <Image
            src={gym.coverImageUrl}
            alt={gym.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center', gradient)}>
            <span className="text-5xl font-bold text-white/30">{gym.name?.[0] ?? '?'}</span>
          </div>
        )}

        {/* Logo overlay */}
        {gym.logoUrl && (
          <div className="absolute bottom-3 left-3 w-12 h-12 rounded-xl bg-white shadow-md overflow-hidden border-2 border-white">
            <Image src={gym.logoUrl} alt={`${gym.name} logo`} fill className="object-contain p-1" />
          </div>
        )}

        {/* Featured badge */}
        {gym.featured && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-primary text-primary-foreground text-xs">Featured</Badge>
          </div>
        )}

        {/* Gender badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={genderBadgeVariant[gym.genderType]} className="text-xs bg-background/90 backdrop-blur-sm">
            {genderLabel[gym.genderType]}
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-base leading-tight line-clamp-1">{gym.name}</h3>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-2">
          <StarRating rating={Number(gym.averageRating) || 0} size="sm" />
          <span className="text-sm font-medium">{(Number(gym.averageRating) || 0).toFixed(1)}</span>
          {gym.totalReviews !== undefined && (
            <span className="text-xs text-muted-foreground">({gym.totalReviews})</span>
          )}
        </div>

        {/* Location */}
        {gym.city && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{gym.area ? `${gym.area.name}, ` : ''}{gym.city.name}</span>
          </div>
        )}

        {/* Price & CTA */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          {gym.startingPrice !== undefined ? (
            <div>
              <p className="text-xs text-muted-foreground">Starting from</p>
              <p className="font-semibold text-primary">{formatCurrency(gym.startingPrice)}</p>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>Members gym</span>
            </div>
          )}
          <Button size="sm" className="shrink-0 pointer-events-none">View Gym</Button>
        </div>
      </div>
    </Link>
  )
}
