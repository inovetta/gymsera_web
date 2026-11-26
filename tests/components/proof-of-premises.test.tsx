/**
 * Enterprise D10: after submit the host uploads proof of premises (POST /host/businesses/:businessId/kyc-documents,
 * type PROOF_OF_PREMISES). Live check 2026-11-26: the API creates the first business only when the organization
 * is approved, so GET /host/businesses is empty (a bare array) until then.
 */
import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProofOfPremisesUpload, PROOF_HEADING, businessNeedingProof, proofState } from '@/components/features/proof-of-premises-upload'
import { hostBusinessesApi, type HostBusiness } from '@/lib/api/organizations'
import apiClient from '@/lib/api/client'

const wrap = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>)

afterEach(() => vi.restoreAllMocks())

const pending: HostBusiness = { id: 'b1', name: 'Live Fitness', status: 'PENDING', missingForApproval: ['PROOF_OF_PREMISES'], kycDocuments: [], createdAt: '2026-11-26T09:00:00Z' }

describe('ProofOfPremisesUpload', () => {
  it('before the organization is approved: the heading, and when the upload opens', async () => {
    vi.spyOn(hostBusinessesApi, 'list').mockResolvedValue([])
    wrap(<ProofOfPremisesUpload />)
    expect(screen.getByText(PROOF_HEADING)).toBeInTheDocument()
    expect(PROOF_HEADING).toBe('Upload your proof of premises to go live')
    expect(await screen.findByTestId('proof-after-approval')).toHaveTextContent('as soon as GymsEra approves your organization')
  })

  it('uploads the file as PROOF_OF_PREMISES to the business, then shows it was received', async () => {
    const list = vi.spyOn(hostBusinessesApi, 'list').mockResolvedValueOnce([pending])
    const upload = vi.spyOn(hostBusinessesApi, 'uploadDocument').mockResolvedValue([])
    wrap(<ProofOfPremisesUpload />)
    const file = new File(['%PDF'], 'premises.pdf', { type: 'application/pdf' })
    list.mockResolvedValueOnce([{ ...pending, kycDocuments: [{ id: 'd1', type: 'PROOF_OF_PREMISES', status: 'PENDING', uploadedAt: '2026-11-26T09:01:00Z', reviewedAt: null, rejectionReason: null }] }])
    fireEvent.change(await screen.findByLabelText('Proof of premises file'), { target: { files: [file] } })
    await waitFor(() => expect(upload).toHaveBeenCalledWith('b1', 'PROOF_OF_PREMISES', file))
    expect(await screen.findByTestId('proof-received')).toBeInTheDocument()
  })

  it('a rejected proof shows the reason and asks for another file', async () => {
    vi.spyOn(hostBusinessesApi, 'list').mockResolvedValue([{ ...pending, kycDocuments: [{ id: 'd1', type: 'PROOF_OF_PREMISES', status: 'REJECTED', uploadedAt: '', reviewedAt: '', rejectionReason: 'Address not readable' }] }])
    wrap(<ProofOfPremisesUpload />)
    expect(await screen.findByTestId('proof-rejected')).toHaveTextContent('Address not readable')
    expect(screen.getByRole('button', { name: /Upload proof of premises/ })).toBeInTheDocument()
  })

  it('once approved: the business is live, with the verified check only when verified', async () => {
    vi.spyOn(hostBusinessesApi, 'list').mockResolvedValue([{ ...pending, status: 'ACTIVE', businessVerified: true }])
    wrap(<ProofOfPremisesUpload />)
    expect(await screen.findByTestId('proof-live')).toHaveTextContent('Live Fitness')
  })
})

describe('helpers', () => {
  it('picks the earliest business not approved yet', () => {
    expect(businessNeedingProof([
      { id: 'b2', name: 'B', status: 'PENDING', createdAt: '2026-11-26T10:00:00Z' },
      { id: 'b0', name: 'A', status: 'ACTIVE', createdAt: '2026-11-26T08:00:00Z' },
      { id: 'b1', name: 'C', status: 'PENDING', createdAt: '2026-11-26T09:00:00Z' },
    ])?.id).toBe('b1')
  })
  it('a proof counts as received unless every one was rejected', () => {
    expect(proofState(pending)).toBe('needed')
  })
})

describe('hostBusinessesApi', () => {
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
