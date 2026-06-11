import Link from 'next/link'
import { Dumbbell, Instagram, Twitter, Facebook, Youtube } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Dumbbell className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white">
                Gyms<span className="text-primary">Era</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Discover, join, and manage gym memberships all in one place. Your fitness journey starts here.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Discover */}
          <div>
            <h3 className="font-semibold text-white mb-4">Discover</h3>
            <ul className="space-y-3">
              {[
                { label: 'Find Gyms', href: '/gyms' },
                { label: 'Top Rated Gyms', href: '/gyms?sortBy=rating' },
                { label: 'Featured Gyms', href: '/gyms?featured=true' },
                { label: 'Browse by City', href: '/gyms' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Businesses */}
          <div>
            <h3 className="font-semibold text-white mb-4">For Businesses</h3>
            <ul className="space-y-3">
              {[
                { label: 'List Your Gym', href: '/for-gym-owners' },
                { label: 'Gym Owner Portal', href: 'http://localhost:3001', external: true },
                { label: 'Pricing Packages', href: '/for-gym-owners#pricing' },
                { label: 'Success Stories', href: '/for-gym-owners' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-3">
              {[
                { label: 'About Us', href: '#' },
                { label: 'Contact', href: '#' },
                { label: 'Privacy Policy', href: '#' },
                { label: 'Terms of Service', href: '#' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} GymsEra. All rights reserved.
          </p>
          <p className="text-sm text-slate-500">
            Made with passion for fitness enthusiasts
          </p>
        </div>
      </div>
    </footer>
  )
}
