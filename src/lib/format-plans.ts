// Mirrors mobile's HostOnboardingNotifier._formatPlansForApi
// (gyms_era/lib/features/host_onboarding/presentation/providers/host_onboarding_providers.dart)
// so a plan staged from the web wizard has the same shape as one staged from
// the app. Keep the two in step; the backend contract test
// (gymsera_be tests/regression/ux-24-tenant-signup-contract.test.js) pins it.

export interface FormattedPlan {
  id?: string
  name: string
  description: string | null
  durationType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  durationValue: number
  price: number
  joiningFee: number
  securityFee: number
  visitLimit: number | null
  freezeLimitDays: number
  isTrial: boolean
  isPublic: boolean
  status: 'ACTIVE'
  isDeactivated: boolean
}

type RawPlan = Record<string, unknown>

const isNum = (v: unknown): v is number => typeof v === 'number' && !Number.isNaN(v)

// Dart's double.tryParse / int.tryParse: whole-string numeric or null.
const parseNum = (v: unknown): number | null => {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  if (s === '' || !/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(s)) return null
  return Number(s)
}
const parseInt10 = (v: unknown): number | null => {
  const s = String(v ?? '').trim()
  return /^[-+]?\d+$/.test(s) ? parseInt(s, 10) : null
}
const toInt = (n: number) => Math.trunc(n)

export function formatPlansForApi(plans: RawPlan[]): FormattedPlan[] {
  return plans.map((p) => {
    const durationStr = String(p.durationType ?? p.duration ?? 'MONTHLY').toUpperCase()
    let durationType: FormattedPlan['durationType'] = 'MONTHLY'
    let durationValue = isNum(p.durationValue) ? toInt(p.durationValue) : 1

    if (durationStr.includes('DAILY') || durationStr.includes('DAY')) {
      durationType = 'DAILY'
      durationValue = 1
    } else if (durationStr.includes('WEEKLY') || durationStr.includes('WEEK')) {
      durationType = 'WEEKLY'
      durationValue = 1
    } else if (durationStr.includes('QUARTER')) {
      durationType = 'QUARTERLY'
      durationValue = 3
    } else if (durationStr.includes('YEAR') || durationStr.includes('ANNUAL')) {
      durationType = 'YEARLY'
      durationValue = 12
    } else if (durationStr.includes('SEMI') || durationStr.includes('HALF')) {
      durationType = 'MONTHLY'
      durationValue = 6
    }

    const price = isNum(p.price) ? p.price : (parseNum(p.price ?? '5000') ?? 5000)
    const fee = (v: unknown) => (isNum(v) ? v : (parseNum(v ?? '0') ?? 0))

    const description =
      p.description !== undefined && p.description !== null
        ? String(p.description)
        : Array.isArray(p.features)
          ? p.features.join(', ')
          : null

    const idStr = p.id !== undefined && p.id !== null ? String(p.id) : ''

    return {
      ...(idStr ? { id: idStr } : {}),
      name: (p.name as string | undefined | null) ?? 'Standard Plan',
      description,
      durationType,
      durationValue,
      price,
      joiningFee: fee(p.joiningFee),
      securityFee: fee(p.securityFee),
      visitLimit:
        p.visitLimit !== undefined && p.visitLimit !== null
          ? isNum(p.visitLimit)
            ? toInt(p.visitLimit)
            : parseInt10(p.visitLimit)
          : null,
      freezeLimitDays: isNum(p.freezeLimitDays)
        ? toInt(p.freezeLimitDays)
        : (parseInt10(p.freezeLimitDays ?? '0') ?? 0),
      isTrial: p.isTrial === true,
      isPublic: p.isPublic !== false,
      status: 'ACTIVE' as const,
      isDeactivated: false,
    }
  })
}
