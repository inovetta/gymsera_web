import { NextRequest, NextResponse } from 'next/server'

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

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
