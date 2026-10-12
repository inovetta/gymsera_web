'use client'

import { useRef, useState } from 'react'
import { ArrowLeft, ChevronRight, ImagePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { tenantsApi } from '@/lib/api/tenants'
import { extractValidationErrorMessage } from '@/lib/utils'

// Photo count rules are client-side only (the backend has no minimum). The
// type and size limits mirror the backend's upload.images middleware
// (src/middleware/upload.js): JPEG/PNG/WebP, 10 MB each. The server stays the
// authority and its messages are shown as-is.
export const MIN_PHOTOS = 5
export const MAX_PHOTOS = 10
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024
export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface Props {
  tenantId: string
  photos: string[]
  onChange: (photos: string[]) => void
  onBack: () => void
  onContinue: () => void
}

export function RegisterPhotosStep({ tenantId, photos, onChange, onBack, onContinue }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const remaining = MAX_PHOTOS - photos.length
  const canContinue = photos.length >= MIN_PHOTOS

  const handleFiles = async (list: FileList | null) => {
    const files = Array.from(list ?? [])
    if (inputRef.current) inputRef.current.value = ''
    if (files.length === 0) return
    setError('')

    const badType = files.find((f) => !ALLOWED_PHOTO_TYPES.includes(f.type))
    if (badType) return setError(`${badType.name}: only JPEG, PNG and WebP images are accepted.`)
    const tooBig = files.find((f) => f.size > MAX_PHOTO_BYTES)
    if (tooBig) return setError(`${tooBig.name}: file size must not exceed 10 MB.`)
    if (files.length > remaining) {
      return setError(`You can add ${remaining} more photo${remaining === 1 ? '' : 's'} (maximum ${MAX_PHOTOS}).`)
    }

    setBusy(true)
    try {
      const res = await tenantsApi.uploadOnboardingImages(tenantId, files)
      onChange(res.data.imagesJson)
    } catch (err) {
      setError(extractValidationErrorMessage(err, 'Failed to upload photos.'))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (index: number) => {
    const next = photos.filter((_, i) => i !== index)
    setError('')
    setBusy(true)
    try {
      await tenantsApi.replaceOnboardingImages(tenantId, next)
      onChange(next)
    } catch (err) {
      setError(extractValidationErrorMessage(err, 'Failed to remove photo.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Gym Photos</h1>
        <p className="text-muted-foreground text-sm">
          Add {MIN_PHOTOS} to {MAX_PHOTOS} photos of your gym. JPEG, PNG or WebP, up to 10 MB each.
          You can change photos anytime from your dashboard.
        </p>
      </div>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

      {photos.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3" aria-label="Gym photos">
          {photos.map((url, i) => (
            <li key={`${url}-${i}`} className="relative aspect-square rounded-xl overflow-hidden border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Gym photo ${i + 1}`} className="w-full h-full object-cover" />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute top-1.5 right-1.5 h-8 w-8 p-0"
                aria-label={`Remove photo ${i + 1}`}
                disabled={busy}
                onClick={() => remove(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="bg-card border rounded-xl p-4 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {photos.length} of {MAX_PHOTOS} added
          {!canContinue && ` — add at least ${MIN_PHOTOS - photos.length} more to continue`}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_PHOTO_TYPES.join(',')}
          multiple
          className="sr-only"
          aria-label="Upload photos"
          data-testid="photo-input"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={busy || remaining <= 0}
          loading={busy}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4 mr-1" /> Add photos
        </Button>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" type="button" onClick={onBack} disabled={busy}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button type="button" size="lg" disabled={!canContinue || busy} onClick={onContinue}>
          Continue to Plans <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
