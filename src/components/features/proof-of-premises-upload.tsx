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

/** The reason of the host's last rejected proof of premises, if every proof was rejected. */
export function rejectedProofReason(b: HostBusiness | undefined): string | null {
  const proofs = (b?.kycDocuments ?? []).filter((d) => d.type === 'PROOF_OF_PREMISES')
  if (!proofs.length || proofs.some((d) => d.status !== 'REJECTED')) return null
  return proofs.find((d) => d.rejectionReason)?.rejectionReason ?? ''
}

/**
 * Enterprise D10: a business goes live after GymsEra approves it, and approval needs proof of premises.
 * The server says what comes next (GET /host/status `nextStep`, NEW-303 M3e):
 * `upload_proof_of_premises` → upload to `nextStep.businessId`; `wait_for_business_approval` → received;
 * null → either the organization is still under review (no business yet) or the business is live.
 */
export function ProofOfPremisesUpload() {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  const stepQuery = useQuery({ queryKey: ['host-next-step'], queryFn: hostBusinessesApi.nextStep, retry: false })
  const listQuery = useQuery({ queryKey: ['host-businesses'], queryFn: hostBusinessesApi.list, retry: false })
  const step = stepQuery.data ?? null
  const businesses = listQuery.data ?? []
  const business = step ? businesses.find((b) => b.id === step.businessId) : undefined
  const name = business?.name ?? 'your business'

  const upload = useMutation({
    mutationFn: (file: File) => hostBusinessesApi.uploadDocument(step!.businessId, 'PROOF_OF_PREMISES', file),
    onSuccess: () => {
      setError('')
      queryClient.invalidateQueries({ queryKey: ['host-next-step'] })
      queryClient.invalidateQueries({ queryKey: ['host-businesses'] })
    },
    onError: (err) => setError(resolveApiError(err).message),
  })

  const live = businesses.filter((b) => String(b.status ?? '').toUpperCase() === 'ACTIVE')
  const rejected = rejectedProofReason(business)

  return (
    <section className="text-left bg-card border rounded-2xl p-5 space-y-3" data-testid="proof-of-premises">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">{PROOF_HEADING}</h2>
      </div>

      {stepQuery.isLoading || listQuery.isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : step?.key === 'upload_proof_of_premises' ? (
        <>
          <p className="text-sm text-muted-foreground">
            A utility bill, lease or ownership paper for the address of <strong>{name}</strong>. PDF, JPG or PNG.
          </p>
          {rejected !== null && (
            <p className="text-sm text-destructive" data-testid="proof-rejected">
              Your last file was not accepted{rejected ? `: ${rejected}` : '.'} Please upload another.
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
      ) : step?.key === 'wait_for_business_approval' ? (
        <p className="flex items-center gap-2 text-sm text-success" data-testid="proof-received">
          <CheckCircle className="h-4 w-4" /> Proof of premises received. GymsEra is reviewing {name}.
        </p>
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
          <Button type="button" variant="outline" size="sm" onClick={() => { stepQuery.refetch(); listQuery.refetch() }} loading={stepQuery.isFetching}>
            Check again
          </Button>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </section>
  )
}
