'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { REPORT_REASONS, ReportReason, reportsApi } from '@/lib/api/reports'

export const THANKS = 'Thanks for your report. Our team reviews every report within 24 hours, and you will no longer see this review.'

interface Props {
  reviewId: string
  isAuthenticated: boolean
  /** Called when a signed-out visitor presses Report (the page sends them to sign in). */
  onSignInNeeded: () => void
  /** Called after a report is sent (the page reloads the reviews; the server leaves this one out). */
  onReported: () => void
}

/** NEW-256: "Report" on a review: a reason, an optional note, a thank-you message. */
export function ReportReviewButton({ reviewId, isAuthenticated, onSignInNeeded, onReported }: Props) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const start = () => {
    if (!isAuthenticated) {
      onSignInNeeded()
      return
    }
    setReason(null)
    setNote('')
    setSent(false)
    setError(null)
    setOpen(true)
  }

  const send = async () => {
    if (!reason) return
    setSending(true)
    setError(null)
    try {
      await reportsApi.reportReview(reviewId, reason, note)
      setSent(true)
    } catch (e) {
      const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message || 'Could not send the report. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const close = (next: boolean) => {
    setOpen(next)
    if (!next && sent) onReported()
  }

  return (
    <>
      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground gap-1" onClick={start} aria-label="Report review">
        <Flag className="h-3.5 w-3.5" /> Report
      </Button>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{sent ? 'Report sent' : 'Report this review'}</DialogTitle>
          </DialogHeader>
          {sent ? (
            <p className="text-sm" role="status">{THANKS}</p>
          ) : (
            <div className="space-y-3">
              <fieldset className="space-y-2">
                <legend className="text-sm text-muted-foreground mb-1">Why are you reporting it?</legend>
                {REPORT_REASONS.map((r) => (
                  <label key={r.code} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name={`report-reason-${reviewId}`} value={r.code} checked={reason === r.code} onChange={() => setReason(r.code)} />
                    {r.label}
                  </label>
                ))}
              </fieldset>
              <div className="space-y-1">
                <Label htmlFor={`report-note-${reviewId}`}>Anything else? (optional)</Label>
                <Textarea id={`report-note-${reviewId}`} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            </div>
          )}
          <DialogFooter>
            {sent ? (
              <Button onClick={() => close(false)}>Done</Button>
            ) : (
              <Button onClick={send} disabled={!reason || sending}>{sending ? 'Sending…' : 'Send report'}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
