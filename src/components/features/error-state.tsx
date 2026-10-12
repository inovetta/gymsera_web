'use client'

import { AlertTriangle, RefreshCw, ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { resolveApiError } from '@/lib/api/error-copy'

interface ErrorStateProps {
  /** The error a query or mutation threw. */
  error: unknown
  /** What failed to load, e.g. "your subscriptions". */
  what: string
  /** Wire to `query.refetch`. Retry only shows for errors that can succeed on a second try. */
  onRetry?: () => void
  /** Smaller layout for one failed section of a page (spec §2.5 "Partial"). */
  compact?: boolean
}

/** HTTP status of a failed request, or null when it never reached the server. */
export const statusOf = (error: unknown): number | null =>
  (error as { response?: { status?: number } })?.response?.status ?? null

/** Network failures, timeouts and 5xx can succeed later; other 4xx answers will not change on retry. */
function isRetryable(error: unknown): boolean {
  const status = statusOf(error)
  if (status === null) return true
  return status >= 500 || status === 408 || status === 429
}

/**
 * The error half of the screen-state contract (spec §2.5): the server's own sentence mapped through
 * the shared copy table, Retry only when a retry can help, and the request id to quote to support.
 * A 403 never shows raw: it says what is missing.
 */
export function ErrorState({ error, what, onRetry, compact = false }: ErrorStateProps) {
  const status = statusOf(error)
  const forbidden = status === 403
  const resolved = resolveApiError(error)
  const message = forbidden
    ? `You do not have access to ${what}.`
    : status === null
      ? 'Could not reach the server. Check your connection and try again.'
      : resolved.code || (error as { response?: { data?: { message?: string } } })?.response?.data?.message
        ? resolved.message
        : `We could not load ${what}. Please try again.`
  const Icon = forbidden ? ShieldOff : AlertTriangle

  return (
    <div
      role="alert"
      data-testid="error-state"
      className={`flex flex-col items-center justify-center px-4 text-center ${compact ? 'py-8' : 'py-16'}`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <Icon className="h-6 w-6 text-destructive" aria-hidden="true" />
      </div>
      <p className="max-w-md text-sm text-foreground">{message}</p>
      {resolved.requestId && (
        <p className="mt-2 text-xs text-muted-foreground">
          Reference: <span className="font-mono">{resolved.requestId}</span>
        </p>
      )}
      {!forbidden && onRetry && isRetryable(error) && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Retry
        </Button>
      )}
    </div>
  )
}
