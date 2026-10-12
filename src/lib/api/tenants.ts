import apiClient from './client'
import { ApiResponse, Tenant } from '@/types'
import type { FormattedPlan } from '@/lib/format-plans'

export interface RegisterTenantPayload {
  businessName: string
  email: string
  phone: string
  cityId: number
}

export interface MainBranchData {
  name: string
  address?: string
  latitude?: number
  longitude?: number
  phone?: string | null
  openingTime?: string | null
  closingTime?: string | null
  cityId?: number | null
  plans?: FormattedPlan[]
}

export interface GymProfilePayload {
  gymName: string
  gymDescription: string
  genderType: string
  address?: string
  latitude?: number
  longitude?: number
  logoUrl?: string
  coverImageUrl?: string
  mainBranchData?: MainBranchData
}

export interface SelectPackagePayload {
  packageId: string
}

export interface FinalizeApplicationPayload {
  paymentMethod: 'BANK_TRANSFER' | 'PAY_LATER'
  bankTransferRef?: string
}

export const tenantsApi = {
  getMyTenant: async (): Promise<ApiResponse<{ tenant: Tenant }>> => {
    const { data } = await apiClient.get('/tenants/me')
    return data
  },

  registerTenant: async (payload: RegisterTenantPayload): Promise<ApiResponse<{ tenant: Tenant }>> => {
    const { data } = await apiClient.post('/tenants/register', payload)
    return data
  },

  submitGymProfile: async (id: string, payload: GymProfilePayload): Promise<ApiResponse<{ tenant: Tenant }>> => {
    const { data } = await apiClient.post(`/tenants/${id}/gym-profile`, payload)
    return data
  },

  // Step 4 photos, held on the tenant until admin approval. POST appends and
  // returns the FULL merged list; PUT replaces the list (how a removal works).
  // Same two calls as mobile's tenants_repository.dart.
  uploadOnboardingImages: async (id: string, files: File[]): Promise<ApiResponse<{ imagesJson: string[] }>> => {
    const formData = new FormData()
    files.forEach((file) => formData.append('images', file))
    const { data } = await apiClient.post(`/tenants/${id}/onboarding-images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  replaceOnboardingImages: async (id: string, imagesJson: string[]): Promise<ApiResponse<{ imagesJson: string[] }>> => {
    const { data } = await apiClient.put(`/tenants/${id}/onboarding-images`, { imagesJson })
    return data
  },

  selectPackage: async (id: string, payload: SelectPackagePayload): Promise<ApiResponse<{ tenant: Tenant }>> => {
    const { data } = await apiClient.post(`/tenants/${id}/select-package`, payload)
    return data
  },

  finalizeApplication: async (id: string, payload: FinalizeApplicationPayload): Promise<ApiResponse<{ tenant: Tenant }>> => {
    const { data } = await apiClient.post(`/tenants/${id}/finalize`, payload)
    return data
  },

  uploadKycDocuments: async (
    id: string,
    files: File[],
    documentType?: string
  ): Promise<ApiResponse<{ kycDocuments: Array<{ id: string; name: string; size: number }> }>> => {
    const formData = new FormData()
    files.forEach((file) => formData.append('documents', file))
    if (documentType) {
      formData.append('documentType', documentType)
    }
    const { data } = await apiClient.post(`/tenants/${id}/kyc-documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}
