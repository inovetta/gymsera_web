import apiClient from './client'
import { ApiResponse, Tenant } from '@/types'

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

  uploadLogo: async (id: string, file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData()
    formData.append('logo', file)
    const { data } = await apiClient.post(`/tenants/${id}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  uploadCoverImage: async (id: string, file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData()
    formData.append('cover', file)
    const { data } = await apiClient.post(`/tenants/${id}/cover-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
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
}
