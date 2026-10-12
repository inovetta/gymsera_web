import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { SkipLink } from '@/components/layout/skip-link'
import { OfflineBanner } from '@/components/features/offline-banner'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink />
      <Navbar />
      <OfflineBanner />
      <main id="main-content" tabIndex={-1} className="min-h-screen focus:outline-none">{children}</main>
      <Footer />
    </>
  )
}
