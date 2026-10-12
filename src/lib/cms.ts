/**
 * Resolves the CMS URL from NEXT_PUBLIC_CMS_URL.
 * In production (NODE_ENV === 'production'), strictly NO localhost fallback is permitted.
 * If NEXT_PUBLIC_CMS_URL is unset in production, returns null.
 * In development and test environments, falls back to 'http://localhost:3001' if unset.
 */
export function getCmsUrl(): string | null {
  const envUrl = process.env.NEXT_PUBLIC_CMS_URL?.trim()
  if (envUrl) {
    return envUrl.replace(/\/+$/, '')
  }
  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:3001'
  }
  return null
}
