import { GymReview } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StarRating } from './star-rating'
import { getInitials, formatRelativeTime } from '@/lib/utils'

interface ReviewCardProps {
  review: GymReview
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={review.user?.profileImageUrl} />
          <AvatarFallback className="text-xs">
            {review.user ? getInitials(review.user.fullName) : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-sm">{review.user?.fullName || 'Anonymous'}</p>
            <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(review.createdAt)}</span>
          </div>
          <StarRating rating={review.rating} size="sm" className="mt-0.5" />
        </div>
      </div>
      {review.title && <h4 className="font-semibold text-sm mb-1">{review.title}</h4>}
      <p className="text-sm text-muted-foreground leading-relaxed">{review.body}</p>
    </div>
  )
}
