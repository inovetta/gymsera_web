import { describe, it, expect } from 'vitest'
import { fitnessFormValues, fitnessUpdatePayload } from '@/lib/profile-fitness'

// GET /me/profile answers { profile: { ..., profile: { heightCm, weightKg, gender, dateOfBirth, fitnessGoal } } }
// and PATCH /me/profile validates heightCm / weightKg (gymsera_be me.validator.js updateProfile).
describe('web profile fitness form <-> /me/profile', () => {
  const serverUser = {
    id: 'u1',
    fullName: 'A Member',
    profile: { gender: 'MALE', dateOfBirth: '1990-02-03', heightCm: 175, weightKg: 70, fitnessGoal: 'MUSCLE_GAIN' },
  }

  it('fills the form from the nested profile the API returns', () => {
    expect(fitnessFormValues(serverUser as never)).toEqual({
      gender: 'MALE',
      dateOfBirth: '1990-02-03',
      height: 175,
      weight: 70,
      fitnessGoal: 'MUSCLE_GAIN',
    })
  })

  it('sends heightCm and weightKg, and only fields the API stores', () => {
    const payload = fitnessUpdatePayload({ gender: 'MALE', dateOfBirth: '1990-02-03', height: 180, weight: 75, fitnessGoal: 'ENDURANCE' })
    expect(payload).toEqual({ gender: 'MALE', dateOfBirth: '1990-02-03', heightCm: 180, weightKg: 75, fitnessGoal: 'ENDURANCE' })
    expect(Object.keys(payload)).not.toEqual(expect.arrayContaining(['height']))
  })

  it('leaves out empty values instead of sending 0 or an empty string', () => {
    expect(fitnessUpdatePayload({ gender: '', dateOfBirth: '', height: 0, weight: undefined, fitnessGoal: '' })).toEqual({})
  })
})
