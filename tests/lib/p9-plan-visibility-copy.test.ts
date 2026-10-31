// Phase 7 P9: plan-visibility and branch codes resolve to the same plain copy as the API, the app and
// the CMS. visible_plan_required can answer the registration's submit (tenant.service.js finalize).
import { describe, expect, it } from 'vitest'
import { resolveApiError } from '@/lib/api/error-copy'

const failure = (code: string) => ({ response: { status: 422, data: { success: false, code, message: 'raw server text' } } })

describe('P9 copy', () => {
  it('visible_plan_required names the Show to Travellers switch', () => {
    expect(resolveApiError(failure('visible_plan_required')).message).toBe('Turn on "Show to Travellers" for at least one plan, then try again.')
  })

  it('last_visible_plan', () => {
    expect(resolveApiError(failure('last_visible_plan')).message).toBe(
      'Travellers must always see at least one plan at each branch. Show another plan first, then hide this one.'
    )
  })

  it('last_branch_in_organization follows P5b: the organization goes with it', () => {
    expect(resolveApiError(failure('last_branch_in_organization')).message).toBe(
      'This is the last branch in its organization. Deleting it also deletes the organization.'
    )
  })
})
