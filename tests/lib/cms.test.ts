import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getCmsUrl } from '@/lib/cms'

describe('getCmsUrl', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns configured NEXT_PUBLIC_CMS_URL without trailing slash', () => {
    process.env.NEXT_PUBLIC_CMS_URL = 'https://cms.gymsera.com/'
    expect(getCmsUrl()).toBe('https://cms.gymsera.com')
  })

  it('falls back to http://localhost:3001 in non-production when unset', () => {
    delete process.env.NEXT_PUBLIC_CMS_URL
    process.env.NODE_ENV = 'test'
    expect(getCmsUrl()).toBe('http://localhost:3001')
  })

  it('returns null in production when NEXT_PUBLIC_CMS_URL is missing (no localhost fallback)', () => {
    delete process.env.NEXT_PUBLIC_CMS_URL
    process.env.NODE_ENV = 'production'
    expect(getCmsUrl()).toBeNull()
  })

  it('returns null in production when NEXT_PUBLIC_CMS_URL is empty whitespace', () => {
    process.env.NEXT_PUBLIC_CMS_URL = '   '
    process.env.NODE_ENV = 'production'
    expect(getCmsUrl()).toBeNull()
  })
})
