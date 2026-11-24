/**
 * R-113 / A2 H2: a branch's opening hours as the API's WeeklyHours
 * `{ v: 1, days: { mon: { closed, slots: [{ open, close, for }] }, ... sun } }`. The wizard asks for one
 * opening and one closing time; every day gets that slot. Default 06:00-22:00 (the FirstBranch schema).
 */
export const DEFAULT_OPENING = '06:00'
export const DEFAULT_CLOSING = '22:00'
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

export interface WeeklyHours {
  v: 1
  days: Record<(typeof DAYS)[number], { closed: boolean; slots: Array<{ open: string; close: string; for: 'all' | 'men' | 'women' }> }>
}

export function uniformWeek(opening?: string | null, closing?: string | null): WeeklyHours {
  const open = opening?.trim() || DEFAULT_OPENING
  const close = closing?.trim() || DEFAULT_CLOSING
  const days = {} as WeeklyHours['days']
  for (const d of DAYS) days[d] = { closed: false, slots: [{ open, close, for: 'all' }] }
  return { v: 1, days }
}
