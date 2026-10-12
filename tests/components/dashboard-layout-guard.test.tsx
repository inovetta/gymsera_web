/**
 * UX-02 Layout guard tests
 * (dashboard)/layout.tsx must redirect a user to the CMS only when their
 * verified role from the API is host AND they have no member subscriptions.
 * Do not rely on localStorage alone. Hosts who are also members stay in the member portal.
 * CMS URL from NEXT_PUBLIC_CMS_URL with no localhost fallback in production.
 * If missing, show a clear message instead of redirecting.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DashboardLayout from '@/app/(dashboard)/layout'
import { useAuthStore } from '@/stores/auth.store'

// Mock next/navigation
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
}
const mockNav = {
  pathname: '/dashboard',
}
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockNav.pathname,
}))

// Mock API clients
const authApiMock = vi.hoisted(() => ({
  getMe: vi.fn(),
}))
vi.mock('@/lib/api/auth', () => ({
  authApi: authApiMock,
}))

const meApiMock = vi.hoisted(() => ({
  getSubscriptions: vi.fn(),
}))
vi.mock('@/lib/api/me', () => ({
  meApi: meApiMock,
}))

const renderLayout = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardLayout>
        <div data-testid="dashboard-child">Member Portal Content</div>
      </DashboardLayout>
    </QueryClientProvider>
  )
}

describe('(dashboard)/layout.tsx guard (UX-02)', () => {
  const originalEnv = process.env
  const originalLocation = window.location

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    mockNav.pathname = '/dashboard'

    // Mock window.location for external CMS redirects
    delete (window as any).location
    window.location = {
      href: '',
      replace: vi.fn(),
    } as any

    // Default logged in user in store (localStorage simulation)
    useAuthStore.setState({
      user: {
        id: 'u-1',
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'MEMBER',
        status: 'ACTIVE',
        isVerified: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
      accessToken: 'token-123',
      refreshToken: 'refresh-123',
      isAuthenticated: true,
      isLoading: false,
    })
  })

  afterEach(() => {
    process.env = originalEnv
    window.location = originalLocation
  })

  it('member-only: verified role from API is MEMBER -> stays in member portal', async () => {
    authApiMock.getMe.mockResolvedValue({
      success: true,
      data: {
        id: 'u-1',
        fullName: 'Member User',
        email: 'member@example.com',
        role: 'MEMBER',
        isVerified: true,
        status: 'ACTIVE',
      },
    })
    meApiMock.getSubscriptions.mockResolvedValue({
      success: true,
      data: { memberships: [] },
    })

    renderLayout()

    expect(await screen.findByTestId('dashboard-child')).toBeInTheDocument()
    expect(window.location.href).toBe('')
  })

  it('host+member: verified role is GYM_HOST but user HAS member subscriptions -> stays in member portal', async () => {
    authApiMock.getMe.mockResolvedValue({
      success: true,
      data: {
        id: 'u-2',
        fullName: 'Host Member User',
        email: 'hostmember@example.com',
        role: 'GYM_HOST',
        isHost: true,
        isVerified: true,
        status: 'ACTIVE',
      },
    })
    meApiMock.getSubscriptions.mockResolvedValue({
      success: true,
      data: {
        memberships: [
          {
            id: 'sub-1',
            userId: 'u-2',
            branchId: 'b-1',
            membershipPlanId: 'p-1',
            startDate: '2026-01-01',
            endDate: '2026-12-31',
            status: 'ACTIVE',
            autoRenew: true,
          },
        ],
      },
    })

    renderLayout()

    expect(await screen.findByTestId('dashboard-child')).toBeInTheDocument()
    expect(window.location.href).toBe('')
  })

  it('host-only: verified role is GYM_HOST and user has NO member subscriptions -> redirects to CMS', async () => {
    process.env.NEXT_PUBLIC_CMS_URL = 'https://cms.gymsera.com'
    authApiMock.getMe.mockResolvedValue({
      success: true,
      data: {
        id: 'u-3',
        fullName: 'Host Only User',
        email: 'host@example.com',
        role: 'GYM_HOST',
        isHost: true,
        isVerified: true,
        status: 'ACTIVE',
      },
    })
    meApiMock.getSubscriptions.mockResolvedValue({
      success: true,
      data: { memberships: [] },
    })

    renderLayout()

    await waitFor(() => {
      expect(window.location.href).toBe('https://cms.gymsera.com/dashboard')
    })
    expect(screen.queryByTestId('dashboard-child')).not.toBeInTheDocument()
  })

  it('host-only: when CMS URL is missing in production -> shows clear message instead of redirecting', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env.NEXT_PUBLIC_CMS_URL

    authApiMock.getMe.mockResolvedValue({
      success: true,
      data: {
        id: 'u-4',
        fullName: 'Host User',
        email: 'host@example.com',
        role: 'GYM_HOST',
        isHost: true,
        isVerified: true,
        status: 'ACTIVE',
      },
    })
    meApiMock.getSubscriptions.mockResolvedValue({
      success: true,
      data: { memberships: [] },
    })

    renderLayout()

    // Must show clear message explaining CMS URL is not configured
    expect(await screen.findByText(/host portal unavailable/i)).toBeInTheDocument()
    // Must NOT have redirected to localhost or anywhere else
    expect(window.location.href).toBe('')
    expect(screen.queryByTestId('dashboard-child')).not.toBeInTheDocument()
  })

  it('does not rely on localStorage alone: localStorage says MEMBER but verified API role is GYM_HOST (no subs) -> redirects', async () => {
    // localStorage (auth store) initially says MEMBER
    useAuthStore.setState({
      user: {
        id: 'u-5',
        fullName: 'Tampered Role User',
        email: 'tampered@example.com',
        role: 'MEMBER',
        status: 'ACTIVE',
        isVerified: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
      isAuthenticated: true,
      isLoading: false,
    })

    process.env.NEXT_PUBLIC_CMS_URL = 'https://cms.gymsera.com'

    // Server says GYM_HOST
    authApiMock.getMe.mockResolvedValue({
      success: true,
      data: {
        id: 'u-5',
        fullName: 'Tampered Role User',
        email: 'tampered@example.com',
        role: 'GYM_HOST',
        isHost: true,
        isVerified: true,
        status: 'ACTIVE',
      },
    })
    meApiMock.getSubscriptions.mockResolvedValue({
      success: true,
      data: { memberships: [] },
    })

    renderLayout()

    await waitFor(() => {
      expect(window.location.href).toBe('https://cms.gymsera.com/dashboard')
    })
    expect(screen.queryByTestId('dashboard-child')).not.toBeInTheDocument()
  })

  it('does not rely on localStorage alone: localStorage says GYM_HOST but verified API role is MEMBER -> stays in portal', async () => {
    useAuthStore.setState({
      user: {
        id: 'u-6',
        fullName: 'Old Host User',
        email: 'oldhost@example.com',
        role: 'GYM_HOST',
        status: 'ACTIVE',
        isVerified: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
      isAuthenticated: true,
      isLoading: false,
    })

    // Server says user is actually MEMBER
    authApiMock.getMe.mockResolvedValue({
      success: true,
      data: {
        id: 'u-6',
        fullName: 'Old Host User',
        email: 'oldhost@example.com',
        role: 'MEMBER',
        isHost: false,
        isVerified: true,
        status: 'ACTIVE',
      },
    })
    meApiMock.getSubscriptions.mockResolvedValue({
      success: true,
      data: { memberships: [] },
    })

    renderLayout()

    expect(await screen.findByTestId('dashboard-child')).toBeInTheDocument()
    expect(window.location.href).toBe('')
  })
})
