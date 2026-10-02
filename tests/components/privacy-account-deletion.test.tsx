import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PrivacyPolicyPage from '@/app/(public)/privacy/page'

// AUTH-07 (Prompt 1I): the privacy page used to promise that "all personally identifiable information is
// purged" when nothing was deleted. It must now say what the backend really does (spec §14 R-16 / R-28):
// a 30-day undo window, anonymization, and 6 years' retention of anonymized financial records.
describe('privacy page: account deletion section', () => {
  const text = () => {
    render(<PrivacyPolicyPage />)
    return screen.getByText(/Account Deletion:/i).closest('li')!.textContent ?? ''
  }

  it('tells people how to delete, and that they have 30 days to change their mind', () => {
    const t = text()
    expect(t).toMatch(/Settings/)
    expect(t).toMatch(/30 days/)
  })

  it('says financial records are kept for 6 years, anonymized — not that everything is purged', () => {
    const t = text()
    expect(t).toMatch(/6 years/)
    expect(t).toMatch(/anonymi[sz]ed/i)
    expect(t).not.toMatch(/all personally identifiable information is purged/i)
  })

  it('tells gym owners their store subscription must be cancelled first and that members are affected', () => {
    const t = text()
    expect(t).toMatch(/App Store|Google Play/)
    expect(t).toMatch(/members/i)
  })
})
