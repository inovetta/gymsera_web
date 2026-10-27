import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants'
import nextConfigFor from '../../next.config.mjs'
import { middleware } from '@/middleware'
import fs from 'fs'
import path from 'path'

// The config is a function of the build phase (NEW-132); redirects are the same in every phase.
const nextConfig = nextConfigFor(PHASE_DEVELOPMENT_SERVER)

describe('UX-01: Onboarding removal & 301 redirect', () => {
  it('nextConfig defines permanent redirect from /onboarding to /gym-owner/register', async () => {
    expect(nextConfig.redirects).toBeDefined()
    const redirects = await nextConfig.redirects()
    const onboardingRedirect = redirects.find((r: any) => r.source === '/onboarding')

    expect(onboardingRedirect).toBeDefined()
    expect(onboardingRedirect.destination).toBe('/gym-owner/register')
    expect(onboardingRedirect.permanent).toBe(true)
  })

  it('middleware redirects /onboarding to /gym-owner/register with 301 without requiring login session', () => {
    const req = new NextRequest('http://localhost:3000/onboarding')
    const res = middleware(req)

    expect(res).toBeDefined()
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe('http://localhost:3000/gym-owner/register')
  })

  it('/app/onboarding directory has been deleted', () => {
    const onboardingDirPath = path.resolve(process.cwd(), 'src/app/onboarding')
    expect(fs.existsSync(onboardingDirPath)).toBe(false)
  })
})
