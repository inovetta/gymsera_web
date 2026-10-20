/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  // SEC-18 / SEC-14: headers every response carries. The full CSP is built per request in
  // src/middleware.ts (it needs a nonce) and is Report-Only; the three directives below cannot break a
  // page, so they are enforced now. X-Frame-Options repeats frame-ancestors for older browsers.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=()' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
        ],
      },
    ]
  },
  async redirects() {
    return [
      { source: '/onboarding', destination: '/gym-owner/register', permanent: true },
      { source: '/privacy-policy', destination: '/privacy', permanent: true },
      { source: '/terms-and-conditions', destination: '/terms', permanent: true },
      { source: '/terms-of-service', destination: '/terms', permanent: true },
      { source: '/support', destination: '/contact', permanent: true },
      { source: '/refund-and-cancellation-policy', destination: '/refund-policy', permanent: true },
      { source: '/cancellation-policy', destination: '/refund-policy', permanent: true },
      { source: '/cancellation-refund-policy', destination: '/refund-policy', permanent: true },
    ]
  },
}
export default nextConfig
