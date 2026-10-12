import { describe, it, expect } from 'vitest'
import { formatPlansForApi } from '@/lib/format-plans'

// Same fixture as MOBILE_PLAN in gymsera_be
// tests/regression/ux-24-tenant-signup-contract.test.js: what mobile's
// _formatPlansForApi produces for one plan.
const MOBILE_PLAN = {
  name: 'Monthly',
  description: null,
  durationType: 'MONTHLY',
  durationValue: 1,
  price: 5000,
  joiningFee: 0,
  securityFee: 0,
  visitLimit: null,
  freezeLimitDays: 0,
  isTrial: false,
  isPublic: true,
  status: 'ACTIVE',
  isDeactivated: false,
}

describe('formatPlansForApi (mirror of mobile _formatPlansForApi)', () => {
  it('produces the mobile fixture shape for a minimal plan', () => {
    expect(formatPlansForApi([{ name: 'Monthly', price: 5000 }])).toEqual([MOBILE_PLAN])
  })

  it('is idempotent on an already formatted plan', () => {
    expect(formatPlansForApi([MOBILE_PLAN])).toEqual([MOBILE_PLAN])
  })

  it('normalizes duration strings like mobile', () => {
    const f = (duration: string) => {
      const [p] = formatPlansForApi([{ name: 'x', price: 1, duration }])
      return [p.durationType, p.durationValue]
    }
    expect(f('Daily')).toEqual(['DAILY', 1])
    expect(f('weekly')).toEqual(['WEEKLY', 1])
    expect(f('QUARTERLY')).toEqual(['QUARTERLY', 3])
    expect(f('Annual')).toEqual(['YEARLY', 12])
    expect(f('Half')).toEqual(['MONTHLY', 6])
    // Same matching order as mobile: "SEMI_ANNUAL" contains ANNUAL, so YEARLY wins.
    expect(f('SEMI_ANNUAL')).toEqual(['YEARLY', 12])
  })

  it('parses string numbers, defaults and optional fields', () => {
    const [p] = formatPlansForApi([
      { id: 7, price: '4500.5', joiningFee: '300', visitLimit: '12', freezeLimitDays: '5', features: ['A', 'B'], isTrial: true, isPublic: false },
    ])
    expect(p).toMatchObject({
      id: '7', name: 'Standard Plan', description: 'A, B', price: 4500.5, joiningFee: 300,
      visitLimit: 12, freezeLimitDays: 5, isTrial: true, isPublic: false,
    })
    expect(formatPlansForApi([{ name: 'n' }])[0].price).toBe(5000)
    expect(formatPlansForApi([{ name: 'n', price: 'abc' }])[0].price).toBe(5000)
  })
})
