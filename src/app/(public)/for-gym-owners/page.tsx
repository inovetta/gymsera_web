'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  BarChart3, Users, QrCode, CreditCard, Building2, Dumbbell,
  CheckCircle, ArrowRight, Star, Shield, Zap, TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { packagesApi } from '@/lib/api/packages'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

const benefits = [
  {
    icon: Users,
    title: 'Member Management',
    description: 'Manage all your gym members from one dashboard. Track subscriptions, attendance, and payments.',
    color: 'bg-blue-500',
  },
  {
    icon: QrCode,
    title: 'QR Code Check-In',
    description: 'Members check in with their QR code. Real-time attendance tracking across all branches.',
    color: 'bg-primary',
  },
  {
    icon: CreditCard,
    title: 'Payment Tracking',
    description: 'Track all payments, generate invoices, and manage billing cycles automatically.',
    color: 'bg-green-500',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Get insights on revenue, member retention, attendance patterns, and growth metrics.',
    color: 'bg-purple-500',
  },
  {
    icon: Building2,
    title: 'Multi-Branch Support',
    description: 'Manage multiple gym locations from a single account with unified reporting.',
    color: 'bg-amber-500',
  },
  {
    icon: Dumbbell,
    title: 'Trainer Management',
    description: 'Assign trainers to members, track their schedules, and manage certifications.',
    color: 'bg-cyan-500',
  },
]

const onboardingSteps = [
  {
    step: '01',
    title: 'Register Your Business',
    description: 'Create an account and register your gym business with basic details.',
  },
  {
    step: '02',
    title: 'Set Up Your Profile',
    description: 'Add your gym profile, upload photos, set up branches and membership plans.',
  },
  {
    step: '03',
    title: 'Choose a Package',
    description: 'Select a subscription package that fits your gym size and requirements.',
  },
  {
    step: '04',
    title: 'Go Live!',
    description: 'After approval, your gym goes live on GymsEra. Start accepting members!',
  },
]

const faqs = [
  {
    q: 'How long does the approval process take?',
    a: 'Our team reviews new applications within 1-2 business days. You\'ll receive an email notification once approved.',
  },
  {
    q: 'Can I manage multiple branches?',
    a: 'Yes! Depending on your package, you can add multiple branches and manage them all from one dashboard.',
  },
  {
    q: 'How do members check in?',
    a: 'Each member gets a unique QR code. Staff can scan it at the entrance using any device with our staff app.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'We support cash, bank transfer, card payments, and online payment gateways.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes! We offer a 30-day free trial for new gym owners. No credit card required to get started.',
  },
]

export default function ForGymOwnersPage() {
  const { data: packagesData, isLoading: packagesLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: () => packagesApi.getPackages(),
  })

  const packages = packagesData?.data?.filter((p) => p.status === 'ACTIVE') || []

  return (
    <div className="pt-16 overflow-x-hidden">
      {/* Hero */}
      <section className="hero-gradient min-h-[70vh] flex items-center px-4 py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <Badge className="bg-primary/20 text-primary border-primary/30 mb-6">For Gym Owners</Badge>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 leading-tight">
              Grow Your Gym Business with{' '}
              <span className="text-gradient">GymsEra</span>
            </h1>
            <p className="text-xl text-white/70 mb-10 leading-relaxed">
              The all-in-one platform for gym management. From member onboarding to payment tracking, we&apos;ve got everything you need.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/gym-owner/register">
                <Button size="xl" className="gap-2">
                  Get Started Free <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="#pricing">
                <Button size="xl" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  View Pricing
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 mt-10">
              {[
                { icon: Star, text: '4.9/5 from gym owners' },
                { icon: Shield, text: '30-day free trial' },
                { icon: Zap, text: 'Setup in under 1 hour' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-white/70 text-sm">
                  <Icon className="h-4 w-4 text-primary" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold text-sm mb-2 uppercase tracking-wider">Everything You Need</p>
            <h2 className="text-3xl font-bold">Powerful Features for Gym Owners</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              All the tools you need to run a successful gym, all in one platform
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="group p-6 rounded-2xl border bg-card hover:border-primary/30 hover:shadow-md transition-all">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', benefit.color)}>
                  <benefit.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold text-sm mb-2 uppercase tracking-wider">Simple Onboarding</p>
            <h2 className="text-3xl font-bold">Get Your Gym Live in 4 Steps</h2>
          </div>

          <div className="space-y-8">
            {onboardingSteps.map((step, index) => (
              <div key={step.step} className={cn('flex gap-8 items-center', index % 2 === 1 && 'flex-row-reverse')}>
                <div className="hidden sm:flex w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold items-center justify-center shrink-0">
                  {step.step}
                </div>
                <div className={cn('flex-1 bg-card border rounded-2xl p-6', index % 2 === 1 && 'text-right')}>
                  <div className="sm:hidden inline-flex w-10 h-10 rounded-full bg-primary text-primary-foreground text-sm font-bold items-center justify-center mb-3">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/gym-owner/register">
              <Button size="lg" className="gap-2">
                Start Your Onboarding <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold text-sm mb-2 uppercase tracking-wider">Transparent Pricing</p>
            <h2 className="text-3xl font-bold">Choose Your Package</h2>
            <p className="text-muted-foreground mt-3">Scale as you grow. No hidden fees.</p>
          </div>

          {packagesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Contact us for pricing information</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg, i) => (
                <Card key={pkg.id} className={cn('relative', i === 1 && 'border-primary shadow-lg shadow-primary/10 scale-105')}>
                  {i === 1 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-white">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <h3 className="text-xl font-bold">{pkg.name}</h3>
                    {pkg.description && <p className="text-sm text-muted-foreground">{pkg.description}</p>}
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-primary">{formatCurrency(pkg.price)}</span>
                      <span className="text-muted-foreground text-sm">/{pkg.billingCycle.toLowerCase()}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success" />
                        Up to {pkg.maxBranches} branches
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success" />
                        Up to {pkg.maxMembers} members
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success" />
                        Up to {pkg.maxTrainers} trainers
                      </li>
                      {Object.entries(pkg.featureFlags || {}).filter(([, v]) => v).map(([key]) => (
                        <li key={key} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-success" />
                          {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </li>
                      ))}
                    </ul>
                    <Link href="/gym-owner/register">
                      <Button className="w-full" variant={i === 1 ? 'default' : 'outline'}>
                        Get Started
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-card border rounded-xl p-6">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Gym?</h2>
          <p className="text-primary-foreground/80 mb-8 text-lg">
            Join 500+ gym owners who are already using GymsEra to grow their business.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/gym-owner/register">
              <Button size="xl" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                Start Free Trial <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/gym-owner/register">
              <Button size="xl" className="bg-white text-primary hover:bg-white/90">
                List Your Gym
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
