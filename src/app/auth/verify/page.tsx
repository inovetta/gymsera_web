'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, RefreshCw, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { OTPInput } from '@/components/features/otp-input'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/hooks/use-toast'

const OTP_EXPIRY_SECONDS = 300 // 5 minutes

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const { toast } = useToast()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(OTP_EXPIRY_SECONDS)

  useEffect(() => {
    if (!email) {
      router.push('/auth/register')
    }
  }, [email, router])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((c) => c - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleVerify = useCallback(async (value: string) => {
    if (value.length !== 6) return
    setError('')
    setIsSubmitting(true)
    try {
      const response = await authApi.verifyOTP({ email, code: value })
      if (response.success) {
        const { user, accessToken, refreshToken } = response.data
        setAuth(user, accessToken, refreshToken)
        toast({ title: 'Email verified!', description: 'Your account is now active.', variant: 'success' })
        router.push('/dashboard')
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setError(error.response?.data?.message || 'Invalid OTP. Please try again.')
      setOtp('')
    } finally {
      setIsSubmitting(false)
    }
  }, [email, setAuth, toast, router])

  useEffect(() => {
    if (otp.length === 6) {
      handleVerify(otp)
    }
  }, [otp, handleVerify])

  const handleResend = async () => {
    if (countdown > 0) return
    setIsResending(true)
    setError('')
    try {
      await authApi.resendOTP({ email })
      toast({ title: 'OTP sent!', description: 'A new verification code has been sent to your email.' })
      setCountdown(OTP_EXPIRY_SECONDS)
      setOtp('')
    } catch {
      setError('Failed to resend OTP. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-2xl">Gyms<span className="text-primary">Era</span></span>
        </div>

        {/* Email icon */}
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="h-10 w-10 text-primary" />
        </div>

        <h2 className="text-2xl font-bold mb-2">Check your email</h2>
        <p className="text-muted-foreground mb-2">
          We sent a 6-digit verification code to
        </p>
        <p className="font-semibold text-foreground mb-8">{email}</p>

        {error && (
          <Alert variant="destructive" className="mb-6 text-left">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* OTP Input */}
        <div className="flex justify-center mb-6">
          <OTPInput
            value={otp}
            onChange={setOtp}
            disabled={isSubmitting}
          />
        </div>

        {/* Loading */}
        {isSubmitting && (
          <p className="text-sm text-muted-foreground mb-4 animate-pulse">Verifying...</p>
        )}

        {/* Timer */}
        <div className="mb-6">
          {countdown > 0 ? (
            <p className="text-sm text-muted-foreground">
              Code expires in <span className="font-semibold text-foreground">{formatTime(countdown)}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Your code has expired.</p>
          )}
        </div>

        {/* Resend */}
        <Button
          variant="ghost"
          onClick={handleResend}
          disabled={countdown > 0 || isResending}
          loading={isResending}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {countdown > 0 ? `Resend in ${formatTime(countdown)}` : 'Resend Code'}
        </Button>

        <p className="text-xs text-muted-foreground mt-8">
          Wrong email?{' '}
          <button onClick={() => router.push('/auth/register')} className="text-primary hover:underline">
            Go back
          </button>
        </p>
      </div>
    </div>
  )
}
