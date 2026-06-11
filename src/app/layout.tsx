import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'
import { Providers } from '@/providers'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })

export const metadata: Metadata = {
  title: { default: 'GymsEra', template: '%s | GymsEra' },
  description: 'Find the perfect gym near you. Browse, compare, and join gyms in your city.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
