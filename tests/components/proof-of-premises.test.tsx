/**
 * Enterprise D10 + NEW-303 M3e: after submit the host uploads proof of premises where GET /host/status
 * `nextStep` says (POST /host/businesses/:businessId/kyc-documents, type PROOF_OF_PREMISES).
 * Live check 2026-11-26 (cd5e17a): nextStep is null while the organization waits, then
 * upload_proof_of_premises, then wait_for_business_approval, then null once the business is approved.
 */
import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProofOfPremisesUpload, PROOF_HEADING, rejectedProofReason } from '@/components/features/proof-of-premises-upload'
import { hostBusinessesApi, type HostBusiness } from '@/lib/api/organizations'
import apiClient from '@/lib/api/client'

const wrap = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>)

afterEach(() => vi.restoreAllMocks())

const pending: HostBusiness = { id: 'b1', name: 'Live Fitness', status: 'PENDING', kycDocuments: [], createdAt: '2026-11-26T09:00:00Z' }

describe('ProofOfPremisesUpload', () => {
  it('nextStep null and no business: the heading, and when the upload opens', async () => {
    vi.spyOn(hostBusinessesApi, 'nextStep').mockResolvedValue(null)
    vi.spyOn(hostBusinessesApi, 'list').mockResolvedValue([])
    wrap(<ProofOfPremisesUpload />)
    expect(screen.getByText(PROOF_HEADING)).toBeInTheDocument()
    expect(PROOF_HEADING).toBe('Upload your proof of premises to go live')
    expect(await screen.findByTestId('proof-after-approval')).toHaveTextContent('as soon as GymsEra approves your organization')
  })

  it('upload_proof_of_premises: uploads to nextStep.businessId, then shows it was received', async () => {
    const step = vi.spyOn(hostBusinessesApi, 'nextStep').mockResolvedValueOnce({ key: 'upload_proof_of_premises', businessId: 'b1' })
    vi.spyOn(hostBusinessesApi, 'list').mockResolvedValue([pending])
    const upload = vi.spyOn(hostBusinessesApi, 'uploadDocument').mockResolvedValue([])
    wrap(<ProofOfPremisesUpload />)
    expect(await screen.findByText('Live Fitness')).toBeInTheDocument()
    step.mockResolvedValueOnce({ key: 'wait_for_business_approval', businessId: 'b1' })
    const file = new File(['%PDF'], 'premises.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByLabelText('Proof of premises file'), { target: { files: [file] } })
    await waitFor(() => expect(upload).toHaveBeenCalledWith('b1', 'PROOF_OF_PREMISES', file))
    expect(await screen.findByTestId('proof-received')).toHaveTextContent('reviewing Live Fitness')
  })

  it('a rejected proof shows the reason and asks for another file', async () => {
    vi.spyOn(hostBusinessesApi, 'nextStep').mockResolvedValue({ key: 'upload_proof_of_premises', businessId: 'b1' })
    vi.spyOn(hostBusinessesApi, 'list').mockResolvedValue([{ ...pending, kycDocuments: [{ id: 'd1', type: 'PROOF_OF_PREMISES', status: 'REJECTED', uploadedAt: '', reviewedAt: '', rejectionReason: 'Address not readable' }] }])
    wrap(<ProofOfPremisesUpload />)
    expect(await screen.findByTestId('proof-rejected')).toHaveTextContent('Address not readable')
    expect(screen.getByRole('button', { name: /Upload proof of premises/ })).toBeInTheDocument()
  })

  it('nextStep null with an approved business: it is live', async () => {
    vi.spyOn(hostBusinessesApi, 'nextStep').mockResolvedValue(null)
    vi.spyOn(hostBusinessesApi, 'list').mockResolvedValue([{ ...pending, status: 'ACTIVE', businessVerified: true }])
    wrap(<ProofOfPremisesUpload />)
    expect(await screen.findByTestId('proof-live')).toHaveTextContent('Live Fitness')
  })
})

describe('helpers', () => {
  it('a reason only when every proof was rejected', () => {
    expect(rejectedProofReason(pending)).toBeNull()
    expect(rejectedProofReason({ ...pending, kycDocuments: [{ id: 'd', type: 'PROOF_OF_PREMISES', status: 'REJECTED', uploadedAt: '', reviewedAt: '', rejectionReason: 'x' }] })).toBe('x')
  })
})

describe('hostBusinessesApi', () => {
  it('nextStep reads GET /host/status data.nextStep', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { data: { status: 'ACTIVE', nextStep: { key: 'upload_proof_of_premises', businessId: 'b1' } } } } as never)
    expect(await hostBusinessesApi.nextStep()).toEqual({ key: 'upload_proof_of_premises', businessId: 'b1' })
    expect(get).toHaveBeenCalledWith('/host/status')
  })
  it('reads the bare array the live API sends, and { businesses } too', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: { data: [pending] } } as never)
    expect(await hostBusinessesApi.list()).toEqual([pending])
    get.mockResolvedValueOnce({ data: { data: { businesses: [pending] } } } as never)
    expect(await hostBusinessesApi.list()).toEqual([pending])
  })
  it('posts the file with type PROOF_OF_PREMISES and field documents', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { data: { documents: [] } } } as never)
    await hostBusinessesApi.uploadDocument('b1', 'PROOF_OF_PREMISES', new File(['x'], 'p.pdf'))
    const [url, form] = post.mock.calls[0] as [string, FormData]
    expect(url).toBe('/host/businesses/b1/kyc-documents')
    expect(form.get('type')).toBe('PROOF_OF_PREMISES')
    expect(form.get('documents')).toBeInstanceOf(File)
  })
})
