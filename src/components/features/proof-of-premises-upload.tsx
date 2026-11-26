'use client'

import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, FileUp, Loader2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VerifiedCheck } from '@/components/features/verified-check'
import { hostBusinessesApi, type HostBusiness } from '@/lib/api/organizations'
import { resolveApiError } from '@/lib/api/error-copy'

export const PROOF_HEADING = 'Upload your proof of premises to go live'
const ACCEPT = 'application/pdf,image/jpeg,image/png'

/** The business that still needs its proof of premises: the earliest one not approved yet. */
export function businessNeedingProof(list: HostBusiness[]): HostBusiness | null {
  const open = list
    .filter((b) => String(b.status ?? '').toUpperCase() !== 'ACTIVE')
    .sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')))
  return open[0] ?? null
}

/** What the host's proof of premises looks like on one business. */
export function proofState(b: HostBusiness): 'needed' | 'rejected' | 'received' {
  const proofs = (b.kycDocuments ?? []).filter((d) => d.type === 'PROOF_OF_PREMISES')
  if (proofs.some((d) => d.status !== 'REJECTED')) return 'received'
  if (proofs.length > 0) return 'rejected'
  return 'needed'
}

/**
 * Enterprise D10: a business goes live after GymsEra approves it, and approval needs proof of
 * premises (`POST /host/businesses/:businessId/kyc-documents`, type `PROOF_OF_PREMISES`). The API
 * creates the first business when the organization is approved, so until then there is nothing to
 * attach the file to and this says when the upload opens.
 */
export function ProofOfPremisesUpload() {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  const { data: businesses = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['host-businesses'],
    queryFn: hostBusinessesApi.list,
    retry: false,
  })
  const business = businessNeedingProof(businesses)

  const upload = useMutation({
    mutationFn: (file: File) => hostBusinessesApi.uploadDocument(business!.id, 'PROOF_OF_PREMISES', file),
    onSuccess: () => { setError(''); queryClient.invalidateQueries({ queryKey: ['host-businesses'] }) },
    onError: (err) => setError(resolveApiError(err).message),
  })

  const live = businesses.filter((b) => String(b.status ?? '').toUpperCase() === 'ACTIVE')

  return (
    <section className="text-left bg-card border rounded-2xl p-5 space-y-3" data-testid="proof-of-premises">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">{PROOF_HEADING}</h2>
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : business ? (
        <>
          <p className="text-sm text-muted-foreground">
            A utility bill, lease or ownership paper for the address of <strong>{business.name}</strong>. PDF, JPG or PNG.
          </p>
          {proofState(business) === 'received' ? (
            <p className="flex items-center gap-2 text-sm text-success" data-testid="proof-received">
              <CheckCircle className="h-4 w-4" /> Proof of premises received. GymsEra is checking it.
            </p>
          ) : (
            <>
              {proofState(business) === 'rejected' && (
                <p className="text-sm text-destructive" data-testid="proof-rejected">
                  Your last file was not accepted
                  {(business.kycDocuments ?? []).find((d) => d.type === 'PROOF_OF_PREMISES' && d.rejectionReason)?.rejectionReason
                    ? `: ${(business.kycDocuments ?? []).find((d) => d.type === 'PROOF_OF_PREMISES' && d.rejectionReason)!.rejectionReason}`
                    : '.'}{' '}
                  Please upload another.
                </p>
              )}
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                aria-label="Proof of premises file"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f); e.target.value = '' }}
              />
              <Button type="button" onClick={() => inputRef.current?.click()} loading={upload.isPending} className="gap-2">
                <FileUp className="h-4 w-4" /> Upload proof of premises
              </Button>
            </>
          )}
        </>
      ) : live.length > 0 ? (
        <p className="text-sm text-muted-foreground" data-testid="proof-live">
          {live.map((b) => (
            <span key={b.id} className="mr-3 inline-flex items-center gap-1">
              {b.name} <VerifiedCheck verified={b.businessVerified} /> is live.
            </span>
          ))}
        </p>
      ) : (
        <div className="space-y-2" data-testid="proof-after-approval">
          <p className="text-sm text-muted-foreground">
            You can upload it as soon as GymsEra approves your organization. We will email you; then come back to this page.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()} loading={isFetching}>
            Check again
          </Button>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </section>
  )
}
