/**
 * The API this site calls (NEW-132). NEXT_PUBLIC_API_URL is required for `next build`
 * (build-env.mjs), so this fallback only serves `next dev` and tests, and it is production,
 * never staging.
 */
export const DEFAULT_API_URL = 'https://api.gymsera.com'

/** NEXT_PUBLIC_API_URL, or the production API when it is unset. Read literally so Next inlines it. */
export const apiUrl = (): string => process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL
