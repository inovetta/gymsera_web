import apiClient from './client'
import { ApiResponse, User, MemberSubscription, Payment, AccountStatementEntry } from '@/types'

export interface UpdateProfilePayload {
  fullName?: string
  phone?: string
  gender?: string
  dateOfBirth?: string
  height?: number
  weight?: number
  fitnessGoal?: string
  allergies?: string
  foodPreferences?: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface GetSubscriptionsParams {
  page?: number
  limit?: number
  status?: string
}

export interface GetPaymentsParams {
  page?: number
  limit?: number
  status?: string
}

export interface GetStatementParams {
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
}

export interface SubmitPaymentRequestPayload {
  subscriptionId: string
  amount: number
  method: string
  notes?: string
}

export const meApi = {
  getProfile: async (): Promise<ApiResponse<{ profile: User }>> => {
    const { data } = await apiClient.get('/me/profile')
    return data
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<ApiResponse<{ profile: User }>> => {
    const { data } = await apiClient.patch('/me/profile', payload)
    return data
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post('/me/change-password', payload)
    return data
  },

  uploadProfileImage: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData()
    formData.append('image', file)
    const { data } = await apiClient.post('/me/profile/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  getSubscriptions: async (params?: GetSubscriptionsParams): Promise<ApiResponse<{ memberships: MemberSubscription[] }>> => {
    const { data } = await apiClient.get('/me/subscriptions', { params })
    return data
  },

  getSubscription: async (id: string): Promise<ApiResponse<MemberSubscription>> => {
    const { data } = await apiClient.get(`/me/subscriptions/${id}`)
    return data
  },

  getAttendanceLogs: async (subscriptionId?: string): Promise<ApiResponse<{ checkInTime: string; checkOutTime?: string; branch?: { branchName: string } }[]>> => {
    const { data } = await apiClient.get('/me/attendance', { params: { subscriptionId } })
    return data
  },

  getAccountStatement: async (params?: GetStatementParams): Promise<ApiResponse<{ subscriptions: MemberSubscription[]; payments: Payment[] }>> => {
    const { data } = await apiClient.get('/me/account-statement', { params })
    return data
  },

  exportAccountStatement: async (params?: { startDate?: string; endDate?: string }): Promise<Blob> => {
    const { data } = await apiClient.get('/me/account-statement/export', {
      params,
      responseType: 'blob',
    })
    return data
  },

  getPayments: async (params?: GetPaymentsParams): Promise<ApiResponse<{ payments: Payment[] }>> => {
    const { data } = await apiClient.get('/me/payments', { params })
    return data
  },

  submitPaymentRequest: async (payload: SubmitPaymentRequestPayload): Promise<ApiResponse<{ payment: Payment }>> => {
    const { data } = await apiClient.post('/me/payments', payload)
    return data
  },

  uploadPaymentProof: async (id: string, file: File): Promise<ApiResponse<Payment>> => {
    const formData = new FormData()
    formData.append('image', file)
    const { data } = await apiClient.post(`/me/payments/${id}/proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}
