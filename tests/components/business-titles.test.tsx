/**
 * Enterprise §4 / D3 / D11, contract v2 (R-120): the public site names the BUSINESS and the BRANCH.
 *  - business page: the business name (with the verified check when `businessVerified`), no "by <brand>"
 *    byline, no organization name;
 *  - branch page: "<Business> · <Branch>", the check beside the business name;
 *  - search cards: the traveller name "<Business> · <Branch>", linking to /gyms/<businessId>/branches/<id>;
 *  - the verified check never decides visibility; a hidden business is a 404.
 * Public URLs (/gyms/...) stay; the `id` in them is the businessId.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import BusinessPage from '@/app/(public)/gyms/[id]/page'
import BranchDetailPage from '@/app/(public)/gyms/[id]/branches/[branchId]/page'
import { GymCard } from '@/components/features/gym-card'
import { VERIFIED_EXPLANATION } from '@/components/features/verified-check'
import { discoveryApi } from '@/lib/api/discovery'
import apiClient from '@/lib/api/client'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ id: 'biz-1', branchId: 'br-1' }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a> }))
vi.mock('next/image', () => ({ default: (props: any) => <img alt={props.alt} /> }))
vi.mock('@/hooks/use-auth', () => ({ useAuth: () => ({ user: null, isAuthenticated: false, isLoading: false }) }))
vi.mock('@/components/features/gym-map', () => ({ GymMap: () => <div /> }))

const branch = { id: 'br-1', businessId: 'biz-1', branchName: 'DHA Phase 5', address: 'Street 1', status: 'ACTIVE', facilities: [], images: [] }
// What the API sends for a business (BusinessPublic): never an organization name, a `tenant` or an `organization`.
const business = (over: Record<string, unknown> = {}) => ({
  id: 'biz-1', organizationId: 'org-1', name: 'Iron House', businessVerified: false, averageRating: 4.5, reviewCount: 2,
  genderType: 'MIXED', branches: [branch], ...over,
})
const wrap = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>)

const serve = (biz: Record<string, unknown>) => {
  vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
    if (url === '/discovery/businesses/biz-1') return { data: { success: true, data: { business: biz, membershipPlans: [] } } }
    if (url === '/discovery/businesses/biz-1/reviews') return { data: { success: true, data: { reviews: [] } } }
    throw new Error(`unexpected GET ${url}`)
  })
}

beforeEach(() => vi.restoreAllMocks())

describe('business page /gyms/[id]', () => {
  it('titles the business, with no byline and no organization name', async () => {
    serve(business({ organizationName: 'Khan Fitness Ltd', brandName: 'Khan Fitness Ltd' }))
    wrap(<BusinessPage />)
    expect(await screen.findByRole('heading', { level: 1, name: 'Iron House' })).toBeInTheDocument()
    expect(screen.queryByText(/^by /)).toBeNull()
    expect(document.body.textContent).not.toMatch(/Khan Fitness/)
  })

  it('shows the verified check only when businessVerified, and explains it in the one allowed wording', async () => {
    serve(business({ businessVerified: true }))
    wrap(<BusinessPage />)
    const check = await screen.findByTestId('verified-check')
    expect(check).toHaveAttribute('title', VERIFIED_EXPLANATION)
    expect(VERIFIED_EXPLANATION).toBe('Registration document checked by GymsEra')
    expect(document.body.textContent).not.toMatch(/trusted|licensed|safe/i)
  })

  it('no check without businessVerified: the business is still shown', async () => {
    serve(business({ businessVerified: false }))
    wrap(<BusinessPage />)
    expect(await screen.findByRole('heading', { level: 1, name: 'Iron House' })).toBeInTheDocument()
    expect(screen.queryByTestId('verified-check')).toBeNull()
  })

  it('a business the API hides (404) is "Gym not found", not an error', async () => {
    vi.spyOn(discoveryApi, 'getBusiness').mockRejectedValue({ response: { status: 404, data: { code: 'business_not_available' } } })
    wrap(<BusinessPage />)
    expect(await screen.findByText('Gym not found')).toBeInTheDocument()
  })
})

describe('branch page /gyms/[id]/branches/[branchId]', () => {
  it('titles "<Business> · <Branch>" with the check beside the business name', async () => {
    serve(business({ businessVerified: true, organizationName: 'Khan Fitness Ltd' }))
    wrap(<BranchDetailPage />)
    expect(await screen.findByTestId('branch-title')).toHaveTextContent('Iron House · DHA Phase 5')
    expect(screen.getByTestId('verified-check')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/Khan Fitness/)
  })
})

describe('search card', () => {
  it('shows the traveller name and links to the business and branch ids', () => {
    render(<GymCard gym={{ id: 'br-1', businessId: 'biz-1', name: 'Iron House · DHA Phase 5', businessVerified: true, averageRating: 0, genderType: 'MIXED', status: 'ACTIVE', featured: false } as any} />)
    expect(screen.getByText('Iron House · DHA Phase 5')).toBeInTheDocument()
    expect(screen.getByTestId('verified-check')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/gyms/biz-1/branches/br-1')
  })

  it('normalizes a BranchCard: displayName is the title, and an organization name is never read', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { success: true, data: { branches: [{ id: 'br-1', businessId: 'biz-1', displayName: 'Iron House · DHA Phase 5', businessName: 'Iron House', branchName: 'DHA Phase 5', businessVerified: true, organizationName: 'Khan Fitness Ltd', averageRating: '4.5', reviewCount: 3, genderType: 'MIXED', status: 'ACTIVE' }] } },
    })
    const res = await discoveryApi.getBranches()
    expect(apiClient.get).toHaveBeenCalledWith('/discovery/branches', { params: undefined })
    expect(res.data.branches[0]).toMatchObject({ name: 'Iron House · DHA Phase 5', businessVerified: true, totalReviews: 3 })
  })
})
