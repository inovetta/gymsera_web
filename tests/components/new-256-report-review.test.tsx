import React from 'react'
import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import apiClient from '@/lib/api/client'
import { ReportReviewButton, THANKS } from '@/components/features/report-review-button'
import { ReviewCard } from '@/components/features/review-card'

/**
 * NEW-256 (App Store 1.2, Google Play UGC policy): the website shows member reviews on a gym page,
 * so each review someone else wrote has a "Report" action: a reason picker, an optional note,
 * POST /reports (the same route as the app), then a thank-you message. Signed-out visitors are sent
 * to sign in first. After a report, the page reloads the reviews (the server leaves it out).
 */
const ok = <T,>(data: T) => ({ success: true, message: 'ok', data })

afterEach(() => vi.restoreAllMocks())

const mount = (props: Partial<React.ComponentProps<typeof ReportReviewButton>> = {}) => {
  const onSignInNeeded = vi.fn()
  const onReported = vi.fn()
  render(<ReportReviewButton reviewId="rev-1" isAuthenticated onSignInNeeded={onSignInNeeded} onReported={onReported} {...props} />)
  return { onSignInNeeded, onReported }
}

describe('Report on a review', () => {
  it('signed out: sends the visitor to sign in, sends nothing', () => {
    const post = vi.spyOn(apiClient, 'post')
    const { onSignInNeeded } = mount({ isAuthenticated: false })
    fireEvent.click(screen.getByRole('button', { name: 'Report review' }))
    expect(onSignInNeeded).toHaveBeenCalled()
    expect(screen.queryByText('Report this review')).toBeNull()
    expect(post).not.toHaveBeenCalled()
  })

  it('needs a reason, sends POST /reports, thanks the visitor, and reloads the reviews on close', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: ok({ report: { id: 'r1', status: 'OPEN' } }) } as never)
    const { onReported } = mount()
    fireEvent.click(screen.getByRole('button', { name: 'Report review' }))
    expect(await screen.findByText('Report this review')).toBeInTheDocument()

    const send = screen.getByRole('button', { name: 'Send report' })
    expect(send).toBeDisabled()
    fireEvent.click(screen.getByLabelText('False or misleading'))
    fireEvent.change(screen.getByLabelText('Anything else? (optional)'), { target: { value: ' fake review ' } })
    fireEvent.click(send)

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/reports', { targetType: 'REVIEW', targetId: 'rev-1', reason: 'FALSE_INFO', note: 'fake review' }),
    )
    expect(await screen.findByText(THANKS)).toBeInTheDocument()
    expect(onReported).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(onReported).toHaveBeenCalled()
  })

  it('a refused report shows the server\'s message and keeps the dialog open', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue({ response: { status: 404, data: { message: 'Review not found' } } })
    const { onReported } = mount()
    fireEvent.click(screen.getByRole('button', { name: 'Report review' }))
    fireEvent.click(await screen.findByLabelText('Spam or advertising'))
    fireEvent.click(screen.getByRole('button', { name: 'Send report' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Review not found')
    expect(screen.getByText('Report this review')).toBeInTheDocument()
    expect(onReported).not.toHaveBeenCalled()
  })
})

describe('ReviewCard', () => {
  const review = { id: 'rev-1', businessId: 'g1', userId: 'u2', rating: 4, title: 'Good', body: 'Nice staff', status: 'APPROVED', createdAt: '2026-11-10T10:00:00Z' } as never

  it('shows the action under the review when given one, nothing otherwise', () => {
    const { rerender } = render(<ReviewCard review={review} action={<button>Report review</button>} />)
    expect(screen.getByRole('button', { name: 'Report review' })).toBeInTheDocument()
    rerender(<ReviewCard review={review} />)
    expect(screen.queryByRole('button', { name: 'Report review' })).toBeNull()
  })

  it('the gym page puts Report on every review except the visitor\'s own', () => {
    const page = fs.readFileSync(path.join(process.cwd(), 'src/app/(public)/gyms/[id]/page.tsx'), 'utf8')
    expect(page).toMatch(/user\?\.id === review\.userId \? undefined : \(\s*<ReportReviewButton/)
  })
})
