'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import Image from 'next/image'
import {
  CheckCircle, Dumbbell, Building2, Package, CreditCard, Eye, EyeOff,
  ChevronRight, ArrowLeft, Star, Shield, Clock, AlertCircle, Copy,
  Loader2, Mail, Phone, User, Lock, RefreshCw, ExternalLink,
  FileText, Check, LogIn,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { LocationPicker, LatLng } from '@/components/features/location-picker'
import { authApi } from '@/lib/api/auth'
import { discoveryApi } from '@/lib/api/discovery'
import { tenantsApi } from '@/lib/api/tenants'
import { packagesApi } from '@/lib/api/packages'
import { useAuthStore } from '@/stores/auth.store'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Tenant, PlatformPackage } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

// ── Schemas ──────────────────────────────────────────────────────────────────

const accountSchema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password required'),
})

const businessSchema = z.object({
  businessName: z.string().min(2, 'Business name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone number required'),
  cityId: z.string().min(1, 'City required'),
})

const gymProfileSchema = z.object({
  name: z.string().min(2, 'Gym name required'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  genderType: z.string().min(1, 'Gender type required'),
})

type AccountData = z.infer<typeof accountSchema>
type LoginData = z.infer<typeof loginSchema>
type BusinessData = z.infer<typeof businessSchema>
type GymProfileData = z.infer<typeof gymProfileSchema>

// ── Step Config ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'account', label: 'Account', icon: User, description: 'Create your login' },
  { id: 'verify', label: 'Verify', icon: Mail, description: 'Confirm your email' },
  { id: 'business', label: 'Business', icon: Building2, description: 'Your business info' },
  { id: 'gym', label: 'Gym Profile', icon: Dumbbell, description: 'Gym details' },
  { id: 'package', label: 'Package', icon: Package, description: 'Choose your plan' },
  { id: 'payment', label: 'Payment', icon: CreditCard, description: 'Billing & review' },
  { id: 'done', label: 'Done', icon: CheckCircle, description: 'Application submitted' },
]

const BANK_DETAILS = {
  bankName: 'Meezan Bank',
  accountTitle: 'GymsEra Technologies Pvt Ltd',
  accountNumber: '0247-0105817703',
  iban: 'PK61MEZN0002470105817703',
}

// ── OTP Input ─────────────────────────────────────────────────────────────────

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6)

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = digits.map((d, idx) => (idx === i ? '' : d))
      onChange(next.join(''))
      if (i > 0) inputs.current[i - 1]?.focus()
    }
  }

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const ch = e.target.value.replace(/\D/g, '').slice(-1)
    const next = digits.map((d, idx) => (idx === i ? ch : d))
    onChange(next.join(''))
    if (ch && i < 5) inputs.current[i + 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted.padEnd(6, '').slice(0, 6))
    inputs.current[Math.min(pasted.length, 5)]?.focus()
    e.preventDefault()
  }

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={cn(
            'w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-background transition-all outline-none',
            d ? 'border-primary text-primary' : 'border-border text-foreground',
            'focus:border-primary focus:ring-2 focus:ring-primary/20'
          )}
        />
      ))}
    </div>
  )
}

// ── Feature sidebar items ─────────────────────────────────────────────────────

const FEATURES = [
  { icon: Star, text: 'Member management & QR check-in' },
  { icon: CreditCard, text: 'Automated payment tracking' },
  { icon: Building2, text: 'Multi-branch support' },
  { icon: Shield, text: '30-day free trial included' },
  { icon: Clock, text: 'Setup in under 1 hour' },
]

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function GymOwnerRegisterPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const setAuth = useAuthStore((s) => s.setAuth)
  const { toast } = useToast()

  const [step, setStep] = useState(0) // 0=account, 1=verify, 2=business, 3=gym, 4=package, 5=payment, 6=done
  const [loginMode, setLoginMode] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [otpValue, setOtpValue] = useState('')
  const [otpCountdown, setOtpCountdown] = useState(300)
  const [error, setError] = useState('')
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<PlatformPackage | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'later'>('bank')
  const [bankRef, setBankRef] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Gym profile — location
  const [gymAddress, setGymAddress] = useState('')
  const [gymLocation, setGymLocation] = useState<LatLng | null>(null)

  // Main branch
  const [isMainBranch, setIsMainBranch] = useState(true)
  const [branchPhone, setBranchPhone] = useState('')
  const [openingTime, setOpeningTime] = useState('')
  const [closingTime, setClosingTime] = useState('')

  // Custom branch (when isMainBranch = false)
  const [branchName, setBranchName] = useState('')
  const [branchAddress, setBranchAddress] = useState('')
  const [branchLocation, setBranchLocation] = useState<LatLng | null>(null)
  const [branchBPhone, setBranchBPhone] = useState('')
  const [branchOpeningTime, setBranchOpeningTime] = useState('')
  const [branchClosingTime, setBranchClosingTime] = useState('')

  // Skip auth steps if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      setStep(2)
    }
  }, [authLoading, isAuthenticated])

  // OTP countdown
  useEffect(() => {
    if (step !== 1) return
    setOtpCountdown(300)
    const timer = setInterval(() => setOtpCountdown((c) => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(timer)
  }, [step])

  const { data: citiesData } = useQuery({
    queryKey: ['cities'],
    queryFn: () => discoveryApi.getCities(),
  })

  const { data: packagesData, isLoading: packagesLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: () => packagesApi.getPackages(),
  })

  const cities = citiesData?.data?.cities || []
  const packages = packagesData?.data?.filter((p) => p.status === 'ACTIVE') || []

  // ── Forms ──────────────────────────────────────────────────────────────────

  const accountForm = useForm<AccountData>({ resolver: zodResolver(accountSchema) })
  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) })
  const businessForm = useForm<BusinessData>({ resolver: zodResolver(businessSchema) })
  const gymForm = useForm<GymProfileData>({ resolver: zodResolver(gymProfileSchema) })

  // ── Mutations ──────────────────────────────────────────────────────────────

  const registerMutation = useMutation({
    mutationFn: (data: AccountData) =>
      authApi.register({ fullName: data.fullName, email: data.email, phone: data.phone, password: data.password }),
    onSuccess: (_, vars) => {
      setRegisteredEmail(vars.email)
      setStep(1)
      setError('')
    },
    onError: (err: any) => setError(err?.response?.data?.message || 'Registration failed. Please try again.'),
  })

  const loginMutation = useMutation({
    mutationFn: (data: LoginData) => authApi.login(data),
    onSuccess: (res) => {
      const { user, accessToken, refreshToken } = res.data
      setAuth(user, accessToken, refreshToken)
      setStep(2)
      setError('')
    },
    onError: (err: any) => setError(err?.response?.data?.message || 'Login failed. Check your credentials.'),
  })

  const verifyMutation = useMutation({
    mutationFn: () => authApi.verifyOTP({ email: registeredEmail, code: otpValue }),
    onSuccess: (res) => {
      const { user, accessToken, refreshToken } = res.data
      setAuth(user, accessToken, refreshToken)
      setStep(2)
      setError('')
    },
    onError: (err: any) => setError(err?.response?.data?.message || 'Invalid OTP. Please try again.'),
  })

  const resendMutation = useMutation({
    mutationFn: () => authApi.resendOTP({ email: registeredEmail }),
    onSuccess: () => {
      setOtpCountdown(300)
      setOtpValue('')
      toast({ title: 'OTP Sent', description: 'A new code has been sent to your email.' })
    },
    onError: () => toast({ title: 'Error', description: 'Failed to resend OTP.', variant: 'destructive' }),
  })

  const tenantRegisterMutation = useMutation({
    mutationFn: (data: BusinessData) =>
      tenantsApi.registerTenant({ ...data, cityId: Number(data.cityId) }),
    onSuccess: async (res) => {
      setTenant(res.data.tenant)
      // Role was just upgraded to GYM_HOST in the DB — refresh the JWT so the
      // next request (/gym-profile) passes the authorize('GYM_HOST') check.
      try {
        const stored = useAuthStore.getState().refreshToken
        if (stored) {
          const refreshRes = await authApi.refresh(stored)
          const { accessToken, refreshToken: newRefresh } = refreshRes.data
          const currentUser = useAuthStore.getState().user
          if (currentUser) setAuth(currentUser, accessToken, newRefresh)
        }
      } catch {
        // Non-fatal — proceed to next step; API will 403 if role not updated
      }
      setStep(3)
      setError('')
    },
    onError: (err: any) => setError(err?.response?.data?.message || 'Failed to register business.'),
  })

  const gymProfileMutation = useMutation({
    mutationFn: (data: GymProfileData) => tenantsApi.submitGymProfile(tenant!.id, {
      gymName: data.name,
      gymDescription: data.description,
      genderType: data.genderType,
      address: gymAddress,
      latitude: gymLocation?.lat,
      longitude: gymLocation?.lng,
      mainBranchData: {
        name: isMainBranch ? data.name : (branchName || data.name),
        address: isMainBranch ? gymAddress : branchAddress,
        latitude: isMainBranch ? gymLocation?.lat : branchLocation?.lat,
        longitude: isMainBranch ? gymLocation?.lng : branchLocation?.lng,
        phone: isMainBranch ? (branchPhone || null) : (branchBPhone || null),
        openingTime: isMainBranch ? (openingTime || null) : (branchOpeningTime || null),
        closingTime: isMainBranch ? (closingTime || null) : (branchClosingTime || null),
        cityId: tenant?.cityId ?? null,
      },
    }),
    onSuccess: () => { setStep(4); setError('') },
    onError: (err: any) => setError(err?.response?.data?.message || 'Failed to save gym profile.'),
  })

  const selectPackageMutation = useMutation({
    mutationFn: (pkgId: string) => tenantsApi.selectPackage(tenant!.id, { packageId: pkgId }),
    onSuccess: () => { setStep(5); setError('') },
    onError: (err: any) => setError(err?.response?.data?.message || 'Failed to select package.'),
  })

  const finalizeMutation = useMutation({
    mutationFn: () => tenantsApi.finalizeApplication(tenant!.id, {
      paymentMethod: paymentMethod === 'bank' ? 'BANK_TRANSFER' : 'PAY_LATER',
      bankTransferRef: bankRef || undefined,
    }),
    onSuccess: () => { setStep(6); setError('') },
    onError: (err: any) => setError(err?.response?.data?.message || 'Failed to submit application.'),
  })

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const formatOtpCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  // Visible step index in sidebar (skip "verify" for already-logged-in users)
  const visibleSteps = isAuthenticated ? STEPS.filter((s) => s.id !== 'account' && s.id !== 'verify') : STEPS
  const sidebarStep = isAuthenticated ? Math.max(0, step - 2) : step

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg">Gyms<span className="text-primary">Era</span></span>
          </Link>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {!isAuthenticated && (
              <>
                <span>Already listed?</span>
                <Link href="/auth/login">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <LogIn className="h-3.5 w-3.5" /> Sign In
                  </Button>
                </Link>
              </>
            )}
            {isAuthenticated && (
              <span className="text-sm">Logged in as <span className="font-medium text-foreground">{user?.email}</span></span>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* ── Sidebar ── */}
        <aside className="hidden lg:flex w-80 bg-slate-900 flex-col p-8 shrink-0">
          <div className="mb-10">
            <Badge className="bg-primary/20 text-primary border-primary/30 mb-3">For Gym Owners</Badge>
            <h2 className="text-xl font-bold text-white mb-2">List Your Gym on GymsEra</h2>
            <p className="text-slate-400 text-sm">Join hundreds of gym owners growing their business with us.</p>
          </div>

          {/* Progress steps */}
          <nav className="space-y-1 mb-10">
            {visibleSteps.map((s, i) => {
              const done = sidebarStep > i
              const active = sidebarStep === i
              return (
                <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all',
                    done ? 'bg-success text-white' : active ? 'bg-primary text-white' : 'bg-slate-700 text-slate-400'
                  )}>
                    {done ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className={cn('text-sm font-medium', active ? 'text-white' : done ? 'text-slate-300' : 'text-slate-500')}>
                      {s.label}
                    </p>
                    <p className="text-xs text-slate-500">{s.description}</p>
                  </div>
                </div>
              )
            })}
          </nav>

          {/* Features */}
          <div className="mt-auto space-y-3">
            {FEATURES.map((f) => (
              <div key={f.text} className="flex items-center gap-2.5 text-sm text-slate-400">
                <f.icon className="h-4 w-4 text-primary shrink-0" />
                {f.text}
              </div>
            ))}
          </div>
        </aside>

        {/* ── Main Form Area ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-10">

            {/* Mobile step indicator */}
            <div className="flex items-center gap-1.5 mb-8 lg:hidden overflow-x-auto pb-1">
              {visibleSteps.map((s, i) => (
                <div key={s.id} className={cn(
                  'h-1.5 rounded-full transition-all flex-1 min-w-[20px]',
                  sidebarStep > i ? 'bg-success' : sidebarStep === i ? 'bg-primary' : 'bg-border'
                )} />
              ))}
            </div>

            {/* Global error */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* ── Step 0: Create Account / Login ── */}
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold mb-1">
                    {loginMode ? 'Sign in to continue' : 'Create your account'}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    {loginMode
                      ? 'Use your existing GymsEra account to start the onboarding.'
                      : 'Start your gym owner journey with a free account.'}
                  </p>
                </div>

                {/* Toggle account / login */}
                <div className="flex gap-2 p-1 bg-muted rounded-xl w-fit">
                  <button
                    onClick={() => { setLoginMode(false); setError('') }}
                    className={cn('px-4 py-2 text-sm font-medium rounded-lg transition-all', !loginMode ? 'bg-background shadow text-foreground' : 'text-muted-foreground')}
                  >
                    New Account
                  </button>
                  <button
                    onClick={() => { setLoginMode(true); setError('') }}
                    className={cn('px-4 py-2 text-sm font-medium rounded-lg transition-all', loginMode ? 'bg-background shadow text-foreground' : 'text-muted-foreground')}
                  >
                    Existing Account
                  </button>
                </div>

                {/* Register form */}
                {!loginMode && (
                  <form
                    onSubmit={accountForm.handleSubmit((data) => { setError(''); registerMutation.mutate(data) })}
                    className="space-y-4"
                  >
                    <div>
                      <Label className="mb-2 block">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-10"
                          placeholder="John Smith"
                          {...accountForm.register('fullName')}
                          error={accountForm.formState.errors.fullName?.message}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-2 block">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-10"
                            type="email"
                            placeholder="you@yourcompany.com"
                            {...accountForm.register('email')}
                            error={accountForm.formState.errors.email?.message}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="mb-2 block">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-10"
                            type="tel"
                            placeholder="+92 300 1234567"
                            {...accountForm.register('phone')}
                            error={accountForm.formState.errors.phone?.message}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-2 block">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-10 pr-10"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Min. 8 characters"
                            {...accountForm.register('password')}
                            error={accountForm.formState.errors.password?.message}
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label className="mb-2 block">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-10 pr-10"
                            type={showConfirm ? 'text' : 'password'}
                            placeholder="Repeat password"
                            {...accountForm.register('confirmPassword')}
                            error={accountForm.formState.errors.confirmPassword?.message}
                          />
                          <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      By creating an account you agree to our{' '}
                      <Link href="/privacy-policy" className="underline hover:text-primary">Privacy Policy</Link>
                      {' '}and{' '}
                      <Link href="/terms-of-service" className="underline hover:text-primary">Terms of Service</Link>.
                    </p>

                    <Button type="submit" size="lg" className="w-full" loading={registerMutation.isPending}>
                      Create Account & Continue
                    </Button>
                  </form>
                )}

                {/* Login form */}
                {loginMode && (
                  <form
                    onSubmit={loginForm.handleSubmit((data) => { setError(''); loginMutation.mutate(data) })}
                    className="space-y-4"
                  >
                    <div>
                      <Label className="mb-2 block">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-10"
                          type="email"
                          placeholder="you@yourcompany.com"
                          {...loginForm.register('email')}
                          error={loginForm.formState.errors.email?.message}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="mb-2 block">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-10 pr-10"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Your password"
                          {...loginForm.register('password')}
                          error={loginForm.formState.errors.password?.message}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <Button type="submit" size="lg" className="w-full" loading={loginMutation.isPending}>
                      Sign In & Continue
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* ── Step 1: Verify Email ── */}
            {step === 1 && (
              <div className="space-y-8 text-center">
                <div>
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Check your email</h1>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    We sent a 6-digit code to <span className="font-medium text-foreground">{registeredEmail}</span>.
                    Enter it below to verify your account.
                  </p>
                </div>

                <OtpInput value={otpValue} onChange={setOtpValue} />

                <div className="text-sm text-muted-foreground">
                  {otpCountdown > 0 ? (
                    <span>Code expires in <span className="font-medium text-foreground">{formatOtpCountdown(otpCountdown)}</span></span>
                  ) : (
                    <span className="text-destructive">Code expired</span>
                  )}
                </div>

                <div className="space-y-3">
                  <Button
                    size="lg"
                    className="w-full"
                    disabled={otpValue.length < 6}
                    loading={verifyMutation.isPending}
                    onClick={() => { setError(''); verifyMutation.mutate() }}
                  >
                    Verify Email
                  </Button>
                  <button
                    onClick={() => { if (!resendMutation.isPending) resendMutation.mutate() }}
                    disabled={otpCountdown > 270 || resendMutation.isPending}
                    className="text-sm text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 mx-auto"
                  >
                    {resendMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Resend code
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Business Info ── */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold mb-1">Business Information</h1>
                  <p className="text-muted-foreground text-sm">Tell us about your gym business.</p>
                </div>

                <form
                  onSubmit={businessForm.handleSubmit((data) => { setError(''); tenantRegisterMutation.mutate(data) })}
                  className="space-y-5"
                >
                  <div>
                    <Label className="mb-2 block">Business / Company Name</Label>
                    <Input
                      placeholder="e.g. Fitness Plus Pvt Ltd"
                      {...businessForm.register('businessName')}
                      error={businessForm.formState.errors.businessName?.message}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block">Business Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-10"
                          type="email"
                          placeholder="info@yourcompany.com"
                          {...businessForm.register('email')}
                          error={businessForm.formState.errors.email?.message}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="mb-2 block">Business Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-10"
                          type="tel"
                          placeholder="+92 300 1234567"
                          {...businessForm.register('phone')}
                          error={businessForm.formState.errors.phone?.message}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block">City</Label>
                    <Select onValueChange={(v) => businessForm.setValue('cityId', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your city" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={String(city.id)}>{city.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {businessForm.formState.errors.cityId && (
                      <p className="text-xs text-destructive mt-1">{businessForm.formState.errors.cityId.message}</p>
                    )}
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground flex items-start gap-3">
                    <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Your information is encrypted and used only for account verification and communication.</span>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" size="lg" loading={tenantRegisterMutation.isPending}>
                      Continue to Gym Profile <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* ── Step 3: Gym Profile ── */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold mb-1">Gym Profile</h1>
                  <p className="text-muted-foreground text-sm">
                    This is how your gym will appear on GymsEra. You can update details anytime from your dashboard.
                  </p>
                </div>

                <form
                  onSubmit={gymForm.handleSubmit((data) => {
                    if (!gymAddress) {
                      setError('Please pin your gym location on the map.')
                      return
                    }
                    setError('')
                    gymProfileMutation.mutate(data)
                  })}
                  className="space-y-5"
                >
                  <div>
                    <Label className="mb-2 block">Gym Name</Label>
                    <Input
                      placeholder="e.g. Iron Paradise Gym"
                      {...gymForm.register('name')}
                      error={gymForm.formState.errors.name?.message}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Description <span className="text-muted-foreground font-normal">(min. 20 chars)</span></Label>
                      <span className="text-xs text-muted-foreground">{gymForm.watch('description')?.length ?? 0} chars</span>
                    </div>
                    <Textarea
                      placeholder="Describe your gym, facilities, training style, and what makes you unique..."
                      className="min-h-[110px]"
                      {...gymForm.register('description')}
                      error={gymForm.formState.errors.description?.message}
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">Gender Policy</Label>
                    <Select onValueChange={(v) => gymForm.setValue('genderType', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select policy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MIXED">Mixed (Men & Women)</SelectItem>
                        <SelectItem value="MALE_ONLY">Men Only</SelectItem>
                        <SelectItem value="FEMALE_ONLY">Women Only</SelectItem>
                      </SelectContent>
                    </Select>
                    {gymForm.formState.errors.genderType && (
                      <p className="text-xs text-destructive mt-1">{gymForm.formState.errors.genderType.message}</p>
                    )}
                  </div>

                  {/* Location Picker */}
                  <div>
                    <Label className="mb-2 block">Gym Location</Label>
                    <LocationPicker
                      value={gymLocation}
                      address={gymAddress}
                      onLocationChange={setGymLocation}
                      onAddressChange={setGymAddress}
                      height="260px"
                      placeholder="Search for your gym address…"
                      mapId="gym-location-picker"
                    />
                    {!gymAddress && gymForm.formState.isSubmitted && (
                      <p className="text-xs text-destructive mt-1">Please pin your gym location on the map</p>
                    )}
                  </div>

                  {/* Main Branch Toggle */}
                  <div className="bg-card border rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Is this your main / only branch?</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isMainBranch
                            ? 'The gym address above will be used as the branch location.'
                            : 'Fill in the separate branch details below.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsMainBranch((v) => !v)}
                        className={cn(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                          isMainBranch ? 'bg-primary' : 'bg-border'
                        )}
                      >
                        <span className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                          isMainBranch ? 'translate-x-6' : 'translate-x-1'
                        )} />
                      </button>
                    </div>

                    {/* Main branch — extra contact & hours */}
                    {isMainBranch && (
                      <div className="space-y-4 pt-3 border-t">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Branch Contact & Hours <span className="font-normal normal-case">(optional)</span>
                        </p>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-10"
                            type="tel"
                            placeholder="Branch phone number"
                            value={branchPhone}
                            onChange={(e) => setBranchPhone(e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="mb-1.5 block text-xs">Opening Time</Label>
                            <Input type="time" value={openingTime} onChange={(e) => setOpeningTime(e.target.value)} />
                          </div>
                          <div>
                            <Label className="mb-1.5 block text-xs">Closing Time</Label>
                            <Input type="time" value={closingTime} onChange={(e) => setClosingTime(e.target.value)} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Separate branch form */}
                    {!isMainBranch && (
                      <div className="space-y-4 pt-3 border-t">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Branch Details</p>
                        <div>
                          <Label className="mb-2 block">Branch Name</Label>
                          <Input
                            placeholder="e.g. Main Branch, DHA Location…"
                            value={branchName}
                            onChange={(e) => setBranchName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="mb-2 block">Branch Location</Label>
                          <LocationPicker
                            value={branchLocation}
                            address={branchAddress}
                            onLocationChange={setBranchLocation}
                            onAddressChange={setBranchAddress}
                            height="220px"
                            placeholder="Search for branch address…"
                            mapId="branch-location-picker"
                          />
                        </div>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-10"
                            type="tel"
                            placeholder="Branch phone number (optional)"
                            value={branchBPhone}
                            onChange={(e) => setBranchBPhone(e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="mb-1.5 block text-xs">Opening Time</Label>
                            <Input type="time" value={branchOpeningTime} onChange={(e) => setBranchOpeningTime(e.target.value)} />
                          </div>
                          <div>
                            <Label className="mb-1.5 block text-xs">Closing Time</Label>
                            <Input type="time" value={branchClosingTime} onChange={(e) => setBranchClosingTime(e.target.value)} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground flex items-start gap-3">
                    <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Logo, cover image, and additional branches can be added from your dashboard after approval.</span>
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button variant="outline" type="button" onClick={() => setStep(2)}>
                      <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <Button type="submit" size="lg" loading={gymProfileMutation.isPending}>
                      Continue to Packages <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* ── Step 4: Choose Package ── */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold mb-1">Choose Your Package</h1>
                  <p className="text-muted-foreground text-sm">Select a plan that fits your gym. You can upgrade anytime.</p>
                </div>

                {packagesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
                  </div>
                ) : packages.length === 0 ? (
                  <div className="text-center py-12 border rounded-2xl">
                    <p className="text-muted-foreground">No packages available right now. Please contact us.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {packages.map((pkg, i) => (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg)}
                        className={cn(
                          'cursor-pointer rounded-2xl border-2 p-5 transition-all relative',
                          selectedPackage?.id === pkg.id
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-border hover:border-primary/40 bg-card',
                        )}
                      >
                        {i === 1 && (
                          <div className="absolute -top-3 left-5">
                            <Badge className="bg-primary text-white">Most Popular</Badge>
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg">{pkg.name}</h3>
                              {i === 1 && <Badge variant="outline" className="text-primary border-primary/30 text-xs">Recommended</Badge>}
                            </div>
                            {pkg.description && <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>}
                            <div className="grid grid-cols-3 gap-3 mb-3">
                              <div className="text-center bg-muted/50 rounded-lg p-2">
                                <p className="text-xs text-muted-foreground">Branches</p>
                                <p className="font-bold text-primary">{pkg.maxBranches}</p>
                              </div>
                              <div className="text-center bg-muted/50 rounded-lg p-2">
                                <p className="text-xs text-muted-foreground">Members</p>
                                <p className="font-bold text-primary">{pkg.maxMembers}</p>
                              </div>
                              <div className="text-center bg-muted/50 rounded-lg p-2">
                                <p className="text-xs text-muted-foreground">Trainers</p>
                                <p className="font-bold text-primary">{pkg.maxTrainers}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(pkg.featureFlags || {}).filter(([, v]) => v).slice(0, 4).map(([key]) => (
                                <span key={key} className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Check className="h-3 w-3" />
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-3xl font-bold text-primary">{formatCurrency(pkg.price)}</div>
                            <div className="text-xs text-muted-foreground">/{pkg.billingCycle.toLowerCase()}</div>
                            <div className={cn(
                              'mt-3 w-6 h-6 rounded-full border-2 flex items-center justify-center ml-auto transition-all',
                              selectedPackage?.id === pkg.id ? 'bg-primary border-primary' : 'border-border'
                            )}>
                              {selectedPackage?.id === pkg.id && <Check className="h-3.5 w-3.5 text-white" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button
                    size="lg"
                    disabled={!selectedPackage}
                    loading={selectPackageMutation.isPending}
                    onClick={() => { setError(''); selectedPackage && selectPackageMutation.mutate(selectedPackage.id) }}
                  >
                    Continue to Payment <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 5: Payment & Review ── */}
            {step === 5 && selectedPackage && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold mb-1">Payment & Review</h1>
                  <p className="text-muted-foreground text-sm">
                    Review your subscription details and complete your application.
                  </p>
                </div>

                {/* Order Summary */}
                <div className="border rounded-2xl overflow-hidden">
                  <div className="bg-muted/50 px-5 py-3 border-b">
                    <p className="font-semibold text-sm">Order Summary</p>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Package</span>
                      <span className="font-medium">{selectedPackage.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Billing Cycle</span>
                      <span className="font-medium capitalize">{selectedPackage.billingCycle.toLowerCase()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Branches included</span>
                      <span className="font-medium">Up to {selectedPackage.maxBranches}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Members included</span>
                      <span className="font-medium">Up to {selectedPackage.maxMembers}</span>
                    </div>
                    <div className="border-t pt-3 mt-3 flex justify-between items-end">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Due</p>
                        <p className="text-xs text-muted-foreground">Billed after approval</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{formatCurrency(selectedPackage.price)}</p>
                        <p className="text-xs text-muted-foreground">/{selectedPackage.billingCycle.toLowerCase()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment method selection */}
                <div>
                  <Label className="mb-3 block text-base font-semibold">How would you like to pay?</Label>
                  <div className="space-y-3">
                    <div
                      onClick={() => setPaymentMethod('bank')}
                      className={cn(
                        'cursor-pointer border-2 rounded-xl p-4 transition-all',
                        paymentMethod === 'bank' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                      )}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0', paymentMethod === 'bank' ? 'bg-primary border-primary' : 'border-border')}>
                          {paymentMethod === 'bank' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">Bank Transfer</p>
                          <p className="text-xs text-muted-foreground">Transfer to our bank account and enter your reference</p>
                        </div>
                      </div>

                      {/* Bank details — shown when selected */}
                      {paymentMethod === 'bank' && (
                        <div className="mt-3 bg-muted rounded-xl p-4 space-y-2.5 text-sm">
                          {Object.entries(BANK_DETAILS).map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between gap-2">
                              <span className="text-muted-foreground capitalize min-w-[100px]">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium">{val}</span>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); copyToClipboard(val, key) }}
                                  className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                  {copiedField === key ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div
                      onClick={() => setPaymentMethod('later')}
                      className={cn(
                        'cursor-pointer border-2 rounded-xl p-4 transition-all',
                        paymentMethod === 'later' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0', paymentMethod === 'later' ? 'bg-primary border-primary' : 'border-border')}>
                          {paymentMethod === 'later' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">Pay After Approval</p>
                          <p className="text-xs text-muted-foreground">Submit your application now. Our team will contact you for payment once approved.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bank Reference Number (when bank transfer selected) */}
                {paymentMethod === 'bank' && (
                  <div>
                    <Label className="mb-2 block">Transaction Reference Number <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input
                      placeholder="e.g. TXN-20241205-XXXX"
                      value={bankRef}
                      onChange={(e) => setBankRef(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      If you&apos;ve already made the transfer, enter your transaction reference. Our team will verify it.
                    </p>
                  </div>
                )}

                {/* Application note */}
                <div className="bg-muted/50 rounded-xl p-4 flex items-start gap-3 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    After submitting, our team will review your application within <strong className="text-foreground">1–2 business days</strong> and
                    contact you to finalize payment and account activation.
                  </span>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(4)}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button
                    size="lg"
                    loading={finalizeMutation.isPending}
                    onClick={() => { setError(''); finalizeMutation.mutate() }}
                  >
                    Submit Application <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 6: Confirmation ── */}
            {step === 6 && (
              <div className="text-center space-y-8">
                <div>
                  <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <CheckCircle className="h-12 w-12 text-success" />
                    <div className="absolute inset-0 rounded-full bg-success/10 animate-ping" />
                  </div>
                  <h1 className="text-3xl font-bold mb-3">Application Submitted!</h1>
                  <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Welcome to GymsEra! Your gym registration is now under review.
                    We&apos;ll be in touch within <strong>1–2 business days</strong>.
                  </p>
                </div>

                {/* Summary card */}
                <div className="text-left bg-card border rounded-2xl overflow-hidden">
                  <div className="bg-muted/50 px-5 py-3 border-b">
                    <p className="font-semibold text-sm">Your Application Summary</p>
                  </div>
                  <div className="p-5 space-y-3">
                    {tenant?.businessName && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Business</span>
                        <span className="font-medium">{tenant.businessName}</span>
                      </div>
                    )}
                    {selectedPackage && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Package</span>
                        <span className="font-medium">{selectedPackage.name} — {formatCurrency(selectedPackage.price)}/{selectedPackage.billingCycle.toLowerCase()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment</span>
                      <span className="font-medium">{paymentMethod === 'bank' ? 'Bank Transfer' : 'Pay After Approval'}</span>
                    </div>
                    {bankRef && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Reference</span>
                        <span className="font-medium font-mono">{bankRef}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10 text-xs">
                        Under Review
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* What's next */}
                <div className="text-left space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground">What happens next?</p>
                  {[
                    { icon: Mail, text: "You'll receive a confirmation email at " + (user?.email || registeredEmail) },
                    { icon: Clock, text: 'Our team reviews your application in 1–2 business days' },
                    { icon: Phone, text: 'We contact you to verify payment and finalize setup' },
                    { icon: ExternalLink, text: 'Once approved, you get access to your full CMS dashboard' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <item.icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <p className="text-muted-foreground">{item.text}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Link href="/dashboard">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Go to Dashboard
                    </Button>
                  </Link>
                  <a href={process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3001'} target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="w-full sm:w-auto gap-2">
                      Open CMS Portal <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
