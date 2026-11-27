import apiClient from './client'
import { ApiResponse, Organization } from '@/types'
import type { FormattedPlan } from '@/lib/format-plans'
import type { WeeklyHours } from '@/lib/hours'

/** POST /organizations/register (contract v2 row 45). The organization name is private (D2, D3). */
export interface RegisterOrganizationPayload {
  organizationName: string
  email: string
  phone: string
  cityId: number
}

/**
 * Contract v2 A3 J10: the `FirstBranch` schema (A2 H2), one for first-business, Add Business and the
 * first-branch edit. The city and the area come from our /places API; exactly one of `areaId` /
 * `areaRequestId` is sent.
 */
export interface FirstBranch {
  branchName: string
  cityId: number
  /** Exactly one of `areaId` / `areaRequestId` (a typed area waiting for review). */
  areaId?: number
  areaRequestId?: number
  address: string
  latitude: number
  longitude: number
  googlePlaceId?: string
  phone?: string
  /** WeeklyHours (R-113); the wizard sends one slot on every day, default 06:00-22:00. */
  hours: WeeklyHours
  facilitiesJson?: string[]
  /** URLs of the uploaded photos: at least 3. */
  imagesJson: string[]
  packages: FormattedPlan[]
}

/** POST /organizations/:organizationId/first-business (A3 J10): the first business and its `firstBranch`. */
export interface FirstBusinessPayload {
  /** Required by the API (contract row 46; live check 2026-11-26). */
  organizationName: string
  firstBusinessName: string
  firstBusinessDescription: string
  /** MIXED | MALE_ONLY | FEMALE_ONLY (row 46 since be 36930cd). */
  genderType?: 'MIXED' | 'MALE_ONLY' | 'FEMALE_ONLY'
  /** Optional: URLs from POST /host/staging-images. The wizard collects neither today. */
  logoUrl?: string
  coverImageUrl?: string
  firstBranch: FirstBranch
}

/** A2 H3: one business document. No file name or URL is sent. */
export interface BusinessDocument {
  id: string
  type: 'PROOF_OF_PREMISES' | 'BUSINESS_REGISTRATION'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  uploadedAt: string
  reviewedAt: string | null
  rejectionReason: string | null
}

/** The host's view of one business (GET /host/businesses), the keys the website reads. */
export interface HostBusiness {
  id: string
  name: string
  status: string
  businessVerified?: boolean
  kycStatus?: string
  /** What approval still needs: `PROOF_OF_PREMISES`, `PHOTOS_MIN_3`. */
  missingForApproval?: string[]
  kycDocuments?: BusinessDocument[]
  createdAt?: string
}

/** HostStatus.nextStep (contract v2 §3, NEW-303 M3e): null, or what the host does next for the first business. */
export interface HostNextStep {
  key: 'upload_proof_of_premises' | 'wait_for_business_approval'
  businessId: string
}

/** The host's businesses and their documents (enterprise D10, contract v2 new routes). */
export const hostBusinessesApi = {
  /** `nextStep` of GET /host/status: the server decides the step and the business. */
  nextStep: async (): Promise<HostNextStep | null> => {
    const { data } = await apiClient.get('/host/status')
    return data?.data?.nextStep ?? null
  },

  /** GET /host/businesses: the live API answers a bare array in `data`; `{ businesses }` is read too. */
  list: async (): Promise<HostBusiness[]> => {
    const { data } = await apiClient.get('/host/businesses')
    const d = data?.data
    return Array.isArray(d) ? d : Array.isArray(d?.businesses) ? d.businesses : []
  },

  /** POST /host/businesses/:businessId/kyc-documents, body `type`, files `documents`. */
  uploadDocument: async (businessId: string, type: BusinessDocument['type'], file: File): Promise<BusinessDocument[]> => {
    const formData = new FormData()
    formData.append('type', type)
    formData.append('documents', file)
    const { data } = await apiClient.post(`/host/businesses/${businessId}/kyc-documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data?.data?.documents ?? []
  },
}

export interface SelectPackagePayload {
  packageId: string
}

export interface FinalizeApplicationPayload {
  paymentMethod: 'BANK_TRANSFER' | 'PAY_LATER'
  bankTransferRef?: string
}

export const organizationsApi = {
  getMine: async (): Promise<ApiResponse<{ organization: Organization }>> => {
    const { data } = await apiClient.get('/organizations/me')
    return data
  },

  register: async (payload: RegisterOrganizationPayload): Promise<ApiResponse<{ organization: Organization }>> => {
    const { data } = await apiClient.post('/organizations/register', payload)
    return data
  },

  submitFirstBusiness: async (organizationId: string, payload: FirstBusinessPayload): Promise<ApiResponse<{ organization: Organization }>> => {
    const { data } = await apiClient.post(`/organizations/${organizationId}/first-business`, payload)
    return data
  },

  /**
   * Photos before submit (A3 J12): stateless, nothing is kept on the server. 1 to 10 files in the
   * multipart field `images`; the answer is `data.urls`, which go into `firstBranch.imagesJson`.
   */
  uploadStagingImages: async (files: File[]): Promise<ApiResponse<{ urls: string[] }>> => {
    const formData = new FormData()
    files.forEach((file) => formData.append('images', file))
    const { data } = await apiClient.post('/host/staging-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  selectPackage: async (organizationId: string, payload: SelectPackagePayload): Promise<ApiResponse<{ organization: Organization }>> => {
    const { data } = await apiClient.post(`/organizations/${organizationId}/select-package`, payload)
    return data
  },

  finalizeApplication: async (organizationId: string, payload: FinalizeApplicationPayload): Promise<ApiResponse<{ organization: Organization }>> => {
    const { data } = await apiClient.post(`/organizations/${organizationId}/finalize`, payload)
    return data
  },

  uploadKycDocuments: async (
    organizationId: string,
    files: File[],
    documentType?: string
  ): Promise<ApiResponse<{ kycDocuments: Array<{ id: string; name: string; size: number }> }>> => {
    const formData = new FormData()
    files.forEach((file) => formData.append('documents', file))
    if (documentType) {
      formData.append('documentType', documentType)
    }
    const { data } = await apiClient.post(`/organizations/${organizationId}/kyc-documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}
