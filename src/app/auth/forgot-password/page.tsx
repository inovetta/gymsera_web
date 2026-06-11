'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, KeyRound, Dumbbell, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { OTPInput } from '@/components/features/otp-input'
import { authApi } from '@/lib/api/auth'
import { useToast } from '@/hooks/use-toast'

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
})

const resetSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type EmailFormData = z.infer<typeof emailSchema>
type ResetFormData = z.infer<typeof resetSchema>

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')

  const emailForm = useForm<EmailFormData>({ resolver: zodResolver(emailSchema) })
  const resetForm = useForm<ResetFormData>({ resolver: zodResolver(resetSchema) })

  const onSubmitEmail = async (data: EmailFormData) => {
    setError('')
    try {
      await authApi.requestPasswordReset({ email: data.email })
      setEmail(data.email)
      setStep(2)
      toast({ title: 'OTP sent!', description: 'Check your email for the reset code.' })
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setError(error.response?.data?.message || 'Failed to send reset email.')
    }
  }

  const onSubmitReset = async (data: ResetFormData) => {
    setError('')
    try {
      await authApi.confirmPasswordReset({
        email,
        otp: data.otp,
        newPassword: data.newPassword,
      })
      setStep(3)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setError(error.response?.data?.message || 'Failed to reset password. Check your OTP.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-2xl">Gyms<span className="text-primary">Era</span></span>
        </div>

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <div>
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-center">Forgot Password?</h2>
            <p className="text-muted-foreground text-center mb-8">
              Enter your email and we&apos;ll send you a reset code.
            </p>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-4">
              <div>
                <Label htmlFor="email" className="mb-2 block">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...emailForm.register('email')}
                  error={emailForm.formState.errors.email?.message}
                />
              </div>
              <Button type="submit" className="w-full h-11" loading={emailForm.formState.isSubmitting}>
                Send Reset Code
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        )}

        {/* Step 2: OTP + New Password */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-2 text-center">Reset Password</h2>
            <p className="text-muted-foreground text-center mb-6">
              Enter the code sent to <span className="font-medium text-foreground">{email}</span>
            </p>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={resetForm.handleSubmit(onSubmitReset)} className="space-y-4">
              <div>
                <Label className="mb-3 block text-center">Verification Code</Label>
                <div className="flex justify-center">
                  <OTPInput
                    value={otp}
                    onChange={(v) => {
                      setOtp(v)
                      resetForm.setValue('otp', v)
                    }}
                  />
                </div>
                {resetForm.formState.errors.otp && (
                  <p className="text-xs text-destructive text-center mt-2">{resetForm.formState.errors.otp.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="newPassword" className="mb-2 block">New Password</Label>
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  {...resetForm.register('newPassword')}
                  error={resetForm.formState.errors.newPassword?.message}
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
                  placeholder="Repeat new password"
                  {...resetForm.register('confirmPassword')}
                  error={resetForm.formState.errors.confirmPassword?.message}
                  iconRight={
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
              </div>

              <Button type="submit" className="w-full h-11" loading={resetForm.formState.isSubmitting}>
                Reset Password
              </Button>
            </form>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="text-center">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Password Reset!</h2>
            <p className="text-muted-foreground mb-8">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <Button className="w-full h-11" onClick={() => router.push('/auth/login')}>
              Sign In
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
