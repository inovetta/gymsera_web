'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PlaceSearch } from '@/components/features/places/place-search'
import { areaRequestsApi, LIMIT_MESSAGES, SimilarArea } from '@/lib/api/area-requests'
import { extractValidationErrorMessage } from '@/lib/utils'

/** The area a wizard branch is in: a real area, or a typed one waiting for review. Names are for showing. */
export interface AreaValue {
  areaId?: number
  areaRequestId?: number
  areaName?: string
}

/** What FirstBranch sends for the area: the area, else the request, never both and never neither (null = not chosen). */
export const areaPayload = (v: AreaValue): { areaId: number } | { areaRequestId: number } | null =>
  v.areaId ? { areaId: v.areaId } : v.areaRequestId ? { areaRequestId: v.areaRequestId } : null

/**
 * The CMS's branch-location area field (NEW-265), for the registration wizard: search our areas, or
 * "Not in the list? Keep what you typed", which checks the name and then files an area request.
 */
export function RegisterAreaField({ cityId, value, onChange }: { cityId?: number | null; value: AreaValue; onChange: (next: AreaValue) => void }) {
  return (
    <div data-testid="register-area-field">
      <PlaceSearch
        label="Area"
        kind="area"
        cityId={cityId ?? undefined}
        value={value.areaName ?? ''}
        disabled={!cityId}
        placeholder={cityId ? 'Search for the area' : 'Pick the city first'}
        onPick={(p) => { if (p.area) onChange({ areaId: p.area.id, areaName: p.area.name }) }}
        onTextChange={() => { if (value.areaId || value.areaRequestId) onChange({}) }}
        renderNoMatch={(typed, close) => cityId
          ? <KeepTypedArea cityId={cityId} typed={typed} onDone={(next) => { close(); onChange(next) }} />
          : null}
      />
      {value.areaRequestId && value.areaName && (
        <p data-testid="area-status" className="mt-1 text-xs text-muted-foreground">{value.areaName} (under review)</p>
      )}
    </div>
  )
}

function KeepTypedArea({ cityId, typed, onDone }: { cityId: number; typed: string; onDone: (next: AreaValue) => void }) {
  const [busy, setBusy] = useState(false)
  const [similar, setSimilar] = useState<SimilarArea[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const create = async () => {
    setBusy(true)
    setError(null)
    try {
      const { data } = await areaRequestsApi.create(cityId, typed, true)
      if ('area' in data) onDone({ areaId: data.area.id, areaName: data.area.name })
      else onDone({ areaRequestId: data.areaRequest.id, areaName: data.areaRequest.name })
    } catch (err) {
      setError(extractValidationErrorMessage(err, 'We could not keep that area. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  const check = async () => {
    setBusy(true)
    setError(null)
    try {
      const { data } = await areaRequestsApi.check(cityId, typed)
      if (data.match) return onDone({ areaId: data.match.areaId, areaName: data.match.name })
      if (!data.canRequest) return setError(LIMIT_MESSAGES[data.reason ?? ''] ?? 'You cannot ask for another area right now.')
      if (data.similar.length) return setSimilar(data.similar)
      setBusy(false)
      await create()
    } catch (err) {
      setError(extractValidationErrorMessage(err, 'We could not check that name. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-1 px-2 py-1.5 text-sm" onMouseDown={(e) => e.preventDefault()}>
      {similar ? (
        <>
          <p className="font-medium">Did you mean …?</p>
          <ul className="space-y-1">
            {similar.map((s) => (
              <li key={`${s.name}-${s.areaId ?? 'p'}`}>
                {s.areaId ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => onDone({ areaId: s.areaId!, areaName: s.name })}>{s.name}</Button>
                ) : (
                  <span className="px-3 text-muted-foreground">{s.name} (under review)</span>
                )}
              </li>
            ))}
          </ul>
          <Button type="button" variant="outline" size="sm" loading={busy} onClick={create}>No, keep “{typed}”</Button>
        </>
      ) : (
        <Button type="button" variant="ghost" size="sm" loading={busy} onClick={check}>Not in the list? Keep “{typed}”</Button>
      )}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
