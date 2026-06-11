'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Dumbbell, Calendar, Clock, Search, CreditCard, FileText, ArrowRight, CheckCircle, MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { meApi } from '@/lib/api/me'
import { useAuth } from '@/hooks/use-auth'
import { formatDate, formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: subscriptionsData, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: () => meApi.getSubscriptions({ limit: 5 }),
  })

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: () => meApi.getAttendanceLogs(),
  })

  const subscriptions = subscriptionsData?.data?.memberships || []
  const activeSubscription = subscriptions.find((s) => s.status === 'ACTIVE')
  const recentAttendance = attendanceData?.data?.slice(0, 5) || []
  const totalCheckIns = attendanceData?.data?.length || 0

  const memberSince = user?.createdAt ? formatDate(user.createdAt, 'MMM yyyy') : 'N/A'
  const daysLeft = activeSubscription
    ? Math.max(0, Math.ceil((new Date(activeSubscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {getGreeting()}, {user?.fullName?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Link href="/gyms">
          <Button className="gap-2">
            <Search className="h-4 w-4" />
            Find a Gym
          </Button>
        </Link>
      </div>

      {/* Active Subscription Banner */}
      {subscriptionsLoading ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : activeSubscription ? (
        <div className="bg-gradient-to-r from-primary to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Active Membership</span>
              </div>
              <h2 className="text-2xl font-bold">{activeSubscription.membershipPlan?.name ?? activeSubscription.planName}</h2>
              {(activeSubscription.branch || activeSubscription.gymName) && (
                <div className="flex items-center gap-1 mt-1 text-white/80 text-sm">
                  <MapPin className="h-3.5 w-3.5" />
                  {activeSubscription.branch?.branchName ?? activeSubscription.gymName}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-white/70 text-sm">Days Remaining</p>
              <p className={cn('text-4xl font-bold', daysLeft <= 7 && 'text-yellow-300')}>{daysLeft}</p>
              <p className="text-white/70 text-sm">Expires {formatDate(activeSubscription.endDate)}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Link href={`/subscriptions/${activeSubscription.subscriptionId ?? activeSubscription.id}`}>
              <Button variant="outline" size="sm" className="bg-transparent border-white/30 text-white hover:bg-white/20 hover:text-white">
                View QR Code
              </Button>
            </Link>
            <Link href="/subscriptions">
              <Button variant="outline" size="sm" className="bg-transparent border-white/30 text-white hover:bg-white/20 hover:text-white">
                All Subscriptions
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-2xl p-8 text-center">
          <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-1">No Active Membership</h3>
          <p className="text-muted-foreground text-sm mb-4">Browse gyms and join one to get started on your fitness journey.</p>
          <Link href="/gyms">
            <Button className="gap-2">
              Find a Gym <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Dumbbell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Gyms Joined</p>
              <p className="text-2xl font-bold">{subscriptions.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Check-ins</p>
              {attendanceLoading ? (
                <Skeleton className="h-7 w-12 mt-1" />
              ) : (
                <p className="text-2xl font-bold">{totalCheckIns}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="text-2xl font-bold">{memberSince}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Check-ins</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : recentAttendance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No check-ins yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAttendance.map((log, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle className="h-4 w-4 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {log.branch?.branchName || 'Gym Check-in'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(log.checkInTime, 'MMM d, h:mm a')}
                      </p>
                    </div>
                    {log.checkOutTime && (
                      <Badge variant="outline" className="text-xs shrink-0">Checked out</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Find a Gym', description: 'Browse gyms near you', href: '/gyms', icon: Search, color: 'bg-primary/10 text-primary' },
              { label: 'My Subscriptions', description: 'View and manage memberships', href: '/subscriptions', icon: CreditCard, color: 'bg-blue-500/10 text-blue-500' },
              { label: 'Download Statement', description: 'Get your account statement', href: '/account-statement', icon: FileText, color: 'bg-green-500/10 text-green-500' },
            ].map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors cursor-pointer">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', action.color)}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
