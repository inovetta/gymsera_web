import { NextRequest, NextResponse } from 'next/server'
import { buildCsp, newNonce } from '@/lib/csp'

const PROTECTED_ROUTES = ['/dashboard', '/profile', '/subscriptions', '/payments', '/account-statement']
const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/verify', '/auth/forgot-password']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // UX-01: /onboarding deleted — redirect permanently to /gym-owner/register
  if (pathname === '/onboarding' || pathname.startsWith('/onboarding/')) {
    return NextResponse.redirect(new URL('/gym-owner/register', request.url), 301)
  }

  const session = request.cookies.get('gymsera_session')?.value

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r))
  const isAuth = AUTH_ROUTES.some((r) => pathname.startsWith(r))

  if (isProtected && !session) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuth && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // SEC-14: a fresh nonce per request. Next.js reads it from the CSP header on the REQUEST and puts it on
  // its own inline scripts; the same policy goes out on the response, in Report-Only mode for now.
  const nonce = newNonce()
  const csp = buildCsp({ nonce, development: process.env.NODE_ENV !== 'production' })
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('content-security-policy-report-only', csp)
  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy-Report-Only', csp)
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
