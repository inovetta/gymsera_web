import { BadgeCheck } from 'lucide-react'

/** The only wording of the badge's explanation (enterprise D11): nothing about "trusted", "safe" or "licensed". */
export const VERIFIED_EXPLANATION = 'Registration document checked by GymsEra'

/**
 * D11: a small check beside the business name when `businessVerified`. It never affects whether a
 * business is shown (a business without it is listed all the same).
 */
export function VerifiedCheck({ verified, className }: { verified?: boolean | null; className?: string }) {
  if (!verified) return null
  return (
    <span
      data-testid="verified-check"
      title={VERIFIED_EXPLANATION}
      aria-label={`Verified: ${VERIFIED_EXPLANATION}`}
      className={className ?? 'inline-flex items-center text-primary'}
    >
      <BadgeCheck className="h-4 w-4" aria-hidden="true" />
    </span>
  )
}
