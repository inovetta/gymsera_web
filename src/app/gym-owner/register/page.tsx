import { Suspense } from 'react'
import { GymOwnerRegister } from '@/components/features/gym-owner-register'
import { Loader2 } from 'lucide-react'

export default function GymOwnerRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <GymOwnerRegister />
    </Suspense>
  )
}
