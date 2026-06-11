'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, CreditCard, Wallet, FileText, User, LogOut, Dumbbell, Menu, X, ChevronRight
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useAuthStore } from '@/stores/auth.store'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Subscriptions', href: '/subscriptions', icon: CreditCard },
  { label: 'Payments', href: '/payments', icon: Wallet },
  { label: 'Account Statement', href: '/account-statement', icon: FileText },
  { label: 'Profile', href: '/profile', icon: User },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()
  const logout = useAuthStore((s) => s.logout)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/auth/login?from=${pathname}`)
    }
  }, [isLoading, isAuthenticated, router, pathname])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center animate-pulse">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
          </div>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Dumbbell className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg">Gyms<span className="text-primary">Era</span></span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {item.label}
              {isActive && <ChevronRight className="h-4 w-4 ml-auto opacity-70" />}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      {user && (
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.profileImageUrl} />
              <AvatarFallback className="text-xs">{getInitials(user.fullName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex h-screen bg-muted/30 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col bg-background border-r shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-background border-r z-10">
            <button
              className="absolute top-4 right-4 p-1 rounded-md hover:bg-muted"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Top Bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-16 bg-background border-b shrink-0">
          <button
            className="p-2 rounded-md hover:bg-muted"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Dumbbell className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold">Gyms<span className="text-primary">Era</span></span>
          </Link>
          {user && (
            <div className="ml-auto">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.profileImageUrl} />
                <AvatarFallback className="text-xs">{getInitials(user.fullName)}</AvatarFallback>
              </Avatar>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
