'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { authApi } from '@/lib/api/auth'
import { useToast } from '@/hooks/use-toast'

const schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  terms: z.boolean().refine((v) => v, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const terms = watch('terms')

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const response = await authApi.register({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone,
      })
      if (response.success) {
        toast({ title: 'Account created!', description: 'Please check your email for the verification code.' })
        router.push(`/auth/verify?email=${encodeURIComponent(data.email)}`)
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setError(error.response?.data?.message || 'Registration failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-primary/30 rounded-full blur-2xl" />
        <div className="relative text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Dumbbell className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4">Join GymsEra</h1>
          <p className="text-white/70 text-lg max-w-sm">Create your account and start your fitness journey today.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-background overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl">Gyms<span className="text-primary">Era</span></span>
          </div>

          <h2 className="text-3xl font-bold mb-2">Create your account</h2>
          <p className="text-muted-foreground mb-8">Join thousands of fitness enthusiasts</p>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="mb-2 block">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                {...register('fullName')}
                error={errors.fullName?.message}
              />
            </div>

            <div>
              <Label htmlFor="email" className="mb-2 block">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                error={errors.email?.message}
              />
            </div>

            <div>
              <Label htmlFor="phone" className="mb-2 block">Phone Number <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+92 300 1234567"
                {...register('phone')}
              />
            </div>

            <div>
              <Label htmlFor="password" className="mb-2 block">Password</Label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                {...register('password')}
                error={errors.password?.message}
                iconRight={
                  <button type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="mb-2 block">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat your password"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
                iconRight={
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  id="terms"
                  checked={terms || false}
                  onChange={(e) => setValue('terms', e.target.checked)}
                  className="w-4 h-4 rounded border-input accent-primary"
                />
              </div>
              <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                I agree to the{' '}
                <Link href="#" className="text-primary hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>
              </label>
            </div>
            {errors.terms && <p className="text-xs text-destructive">{errors.terms.message}</p>}

            <Button type="submit" className="w-full h-11" loading={isSubmitting}>
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
