import apiClient from './client'
import { ApiResponse, Organization } from '@/types'
import type { FormattedPlan } from '@/lib/format-plans'

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
  areaId?: number
  areaRequestId?: number
  address: string
  latitude: number
  longitude: number
  googlePlaceId?: string
  phone?: string
  /** One-slot form of the hours (default 06:00-22:00 when absent). */
  openingTime?: string
  closingTime?: string
  facilitiesJson?: string[]
  /** URLs of the uploaded photos: at least 3. */
  imagesJson: string[]
  packages: FormattedPlan[]
}

/** POST /organizations/:organizationId/first-business (A3 J10): the first business and its `firstBranch`. */
export interface FirstBusinessPayload {
  /** Only sent when it changed (the organization name step). */
  organizationName?: string
  firstBusinessName: string
  firstBusinessDescription: string
  genderType: string
  logoUrl?: string
  coverImageUrl?: string
  firstBranch: FirstBranch
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

  // Step 4 photos, held on the organization until admin approval. POST appends and
  // returns the FULL merged list; PUT replaces the list (how a removal works).
  uploadFirstBusinessImages: async (organizationId: string, files: File[]): Promise<ApiResponse<{ imagesJson: string[] }>> => {
    const formData = new FormData()
    files.forEach((file) => formData.append('images', file))
    const { data } = await apiClient.post(`/organizations/${organizationId}/first-business/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  replaceFirstBusinessImages: async (organizationId: string, imagesJson: string[]): Promise<ApiResponse<{ imagesJson: string[] }>> => {
    const { data } = await apiClient.put(`/organizations/${organizationId}/first-business/images`, { imagesJson })
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
