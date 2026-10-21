import { User } from '@/types'
import { UpdateProfilePayload } from '@/lib/api/me'

export interface FitnessFormValues {
  gender?: string
  dateOfBirth?: string
  height?: number
  weight?: number
  fitnessGoal?: string
}

// GET /me/profile nests the member details under `profile`.
export function fitnessFormValues(user: User): FitnessFormValues {
  const p = user.profile
  return {
    gender: p?.gender || '',
    dateOfBirth: p?.dateOfBirth || '',
    height: p?.heightCm ?? undefined,
    weight: p?.weightKg ?? undefined,
    fitnessGoal: p?.fitnessGoal || '',
  }
}

// PATCH /me/profile validates heightCm / weightKg. Empty values are left out, not sent as 0 or "".
export function fitnessUpdatePayload(v: FitnessFormValues): UpdateProfilePayload {
  const out: UpdateProfilePayload = {}
  if (v.gender) out.gender = v.gender
  if (v.dateOfBirth) out.dateOfBirth = v.dateOfBirth
  if (v.height) out.heightCm = v.height
  if (v.weight) out.weightKg = v.weight
  if (v.fitnessGoal) out.fitnessGoal = v.fitnessGoal
  return out
}
