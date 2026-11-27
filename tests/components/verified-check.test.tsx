/** Enterprise D11: the verified check shows only for `businessVerified`, with the one approved wording. */
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VerifiedCheck, VERIFIED_EXPLANATION } from '@/components/features/verified-check'

describe('VerifiedCheck', () => {
  it('shows nothing unless verified', () => {
    const { rerender } = render(<VerifiedCheck verified={false} />)
    expect(screen.queryByTestId('verified-check')).toBeNull()
    rerender(<VerifiedCheck verified={undefined} />)
    expect(screen.queryByTestId('verified-check')).toBeNull()
    rerender(<VerifiedCheck verified={null} />)
    expect(screen.queryByTestId('verified-check')).toBeNull()
  })

  it('explains itself in the approved words only', () => {
    render(<VerifiedCheck verified />)
    const el = screen.getByTestId('verified-check')
    expect(el).toHaveAttribute('title', VERIFIED_EXPLANATION)
    expect(el).toHaveAttribute('aria-label', `Verified: ${VERIFIED_EXPLANATION}`)
    expect(VERIFIED_EXPLANATION).not.toMatch(/trusted|safe|licensed/i)
  })
})
