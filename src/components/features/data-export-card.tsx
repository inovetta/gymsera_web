'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState } from '@/components/features/error-state'
import { meApi } from '@/lib/api/me'

interface Unavailable {
  tenantId: string
  gymName?: string | null
}

/** Saves `json` as a file in the browser. Replaced in tests. */
function saveInBrowser(filename: string, json: string) {
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

interface DataExportCardProps {
  download?: (filename: string, json: string) => void
  now?: () => Date
}

/**
 * GLB-09 (spec §14 R-44): "Download my data". The API builds the export; this only saves it.
 * A gym whose data could not be read is named, so nobody mistakes a partial file for a full one.
 */
export function DataExportCard({ download = saveInBrowser, now = () => new Date() }: DataExportCardProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [unavailable, setUnavailable] = useState<Unavailable[]>([])

  const run = async () => {
    setBusy(true)
    setError(null)
    setUnavailable([])
    try {
      const data = (await meApi.getDataExport()) as { complete?: boolean; unavailable?: Unavailable[] }
      download(`gymsera-my-data-${now().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2))
      if (data.complete === false) setUnavailable(data.unavailable ?? [])
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card id="your-data">
      <CardHeader>
        <CardTitle className="text-base">Your data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Download a copy of everything GymsEra holds about you (profile, memberships, payments, check-ins,
          messages, reviews and devices) as a JSON file. Sign-in secrets are never included.
        </p>
        {error ? <ErrorState error={error} what="your data export" onRetry={run} compact /> : null}
        {unavailable.length > 0 ? (
          <div role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            This file is incomplete. We could not read your data from: {unavailable.map((u) => u.gymName || u.tenantId).join(', ')}.
            Try again later or contact support@gymsera.com.
          </div>
        ) : null}
        <Button onClick={run} loading={busy} disabled={busy}>
          {!busy && <Download className="h-4 w-4" />}
          Download my data
        </Button>
      </CardContent>
    </Card>
  )
}
