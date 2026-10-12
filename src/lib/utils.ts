import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'PKR') {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount)
}

export function formatDate(date: string | Date, pattern = 'MMM dd, yyyy') {
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return format(d, pattern)
}

export function formatRelativeTime(date: string | Date) {
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return formatDistanceToNow(d, { addSuffix: true })
}

export function getInitials(name?: string | null) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'success',
    APPROVED: 'success',
    COMPLETED: 'success',
    PAID: 'success',
    PENDING: 'warning',
    PENDING_REVIEW: 'warning',
    UNDER_REVIEW: 'warning',
    ISSUED: 'warning',
    FROZEN: 'warning',
    INACTIVE: 'secondary',
    CANCELLED: 'secondary',
    EXPIRED: 'secondary',
    REJECTED: 'destructive',
    SUSPENDED: 'destructive',
    FAILED: 'destructive',
    OVERDUE: 'destructive',
  }
  return map[status] || 'secondary'
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function formatDuration(durationType: string, durationValue: number) {
  const map: Record<string, string> = {
    DAILY: durationValue === 1 ? '1 Day' : `${durationValue} Days`,
    WEEKLY: durationValue === 1 ? '1 Week' : `${durationValue} Weeks`,
    MONTHLY: durationValue === 1 ? '1 Month' : `${durationValue} Months`,
    QUARTERLY: durationValue === 1 ? '1 Quarter' : `${durationValue} Quarters`,
    YEARLY: durationValue === 1 ? '1 Year' : `${durationValue} Years`,
  }
  return map[durationType] || `${durationValue} ${durationType}`
}

export function truncateText(str: string, length: number) {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function formatRating(rating: number) {
  return rating.toFixed(1)
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Extracts human-readable field-level validation error messages from API responses (422),
 * such as error.details.errors, data.errors, or error.details.
 * Returns field-level copy (e.g. "A valid phone number is required") instead of generic "Validation failed".
 */
export function extractValidationErrorMessage(error: unknown, defaultMessage = 'Validation failed'): string {
  const err = error as any
  const data = err?.response?.data
  if (!data) {
    return err?.message || defaultMessage
  }

  // 1. Direct array of field errors
  const errorsList: Array<{ field?: string; message?: string } | string> =
    (Array.isArray(data.errors) && data.errors) ||
    (Array.isArray(data.error?.details?.errors) && data.error.details.errors) ||
    (Array.isArray(data.details?.errors) && data.details.errors) ||
    (Array.isArray(data.error?.details) && data.error.details) ||
    (Array.isArray(data.details) && data.details) ||
    []

  if (errorsList.length > 0) {
    const messages = errorsList
      .map((e) => (typeof e === 'string' ? e : e?.message || (e?.field ? `${e.field} is invalid` : null)))
      .filter(Boolean) as string[]
    if (messages.length > 0) {
      return messages.join('. ')
    }
  }

  // 2. Object map of field errors (e.g. { phone: "A valid phone number is required" })
  const detailsObj =
    (typeof data.error?.details === 'object' && !Array.isArray(data.error?.details) ? data.error?.details : null) ||
    (typeof data.details === 'object' && !Array.isArray(data.details) ? data.details : null)

  if (detailsObj) {
    const stringValues = Object.entries(detailsObj)
      .filter(([k, v]) => typeof v === 'string' && k !== 'errors')
      .map(([_, v]) => v as string)
    if (stringValues.length > 0) {
      return stringValues.join('. ')
    }
  }

  // 3. Fallback message (if message is not just the generic "Validation failed")
  if (data.message && data.message !== 'Validation failed') {
    return data.message
  }
  if (data.error?.message && data.error.message !== 'Validation failed') {
    return data.error.message
  }

  return defaultMessage
}

/**
 * Extracts field-level error mappings [{ field, message }] to attach to React Hook Form setError.
 */
export function extractFieldErrors(error: unknown): Array<{ field: string; message: string }> {
  const err = error as any
  const data = err?.response?.data
  if (!data) return []

  const errorsList =
    (Array.isArray(data.errors) && data.errors) ||
    (Array.isArray(data.error?.details?.errors) && data.error.details.errors) ||
    (Array.isArray(data.details?.errors) && data.details.errors) ||
    []

  const result: Array<{ field: string; message: string }> = []
  for (const e of errorsList) {
    if (e && typeof e === 'object' && e.field && e.message) {
      result.push({ field: String(e.field), message: String(e.message) })
    }
  }
  return result
}

