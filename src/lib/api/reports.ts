import apiClient from './client'
import { ApiResponse } from '@/types'

/**
 * NEW-256 (App Store 1.2, Google Play UGC policy): report a review. The same POST /reports route
 * the app uses. Signed-in people only; the server hides the review from the reporter at once and
 * GymsEra's team reviews every report within 24 hours.
 */

export const REPORT_REASONS = [
  { code: 'SPAM', label: 'Spam or advertising' },
  { code: 'HARASSMENT', label: 'Harassment or bullying' },
  { code: 'HATE', label: 'Hate speech' },
  { code: 'SEXUAL', label: 'Sexual content' },
  { code: 'VIOLENCE', label: 'Violence or threats' },
  { code: 'FALSE_INFO', label: 'False or misleading' },
  { code: 'OTHER', label: 'Something else' },
] as const

export type ReportReason = (typeof REPORT_REASONS)[number]['code']

export const reportsApi = {
  reportReview: async (reviewId: string, reason: ReportReason, note?: string): Promise<ApiResponse<{ report: { id: string; status: string } }>> => {
    const trimmed = note?.trim()
    const { data } = await apiClient.post('/reports', {
      targetType: 'REVIEW',
      targetId: reviewId,
      reason,
      ...(trimmed ? { note: trimmed } : {}),
    })
    return data
  },
}
