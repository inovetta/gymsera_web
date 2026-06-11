import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}

export function StarRating({ rating: ratingProp, max = 5, size = 'md', showValue = false, className }: StarRatingProps) {
  const rating = Number(ratingProp) || 0
  const sizeClass = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }[size]

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(rating)
        const partial = !filled && i < rating

        return (
          <div key={i} className="relative">
            <Star className={cn(sizeClass, 'text-muted-foreground/30 fill-muted-foreground/30')} />
            {(filled || partial) && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: partial ? `${(rating % 1) * 100}%` : '100%' }}
              >
                <Star className={cn(sizeClass, 'text-warning fill-warning')} />
              </div>
            )}
          </div>
        )
      })}
      {showValue && (
        <span className="text-sm font-medium text-foreground ml-1">{rating.toFixed(1)}</span>
      )}
    </div>
  )
}
