import apiClient from './client'
import { ApiResponse, MemberSubscription, Payment, Invoice } from '@/types'

export interface CreateSubscriptionPayload {
  planId: string
  gymListingId: string
  branchId: string
  autoRenew?: boolean
}

export interface FreezeSubscriptionPayload {
  freezeFrom: string
  freezeTo: string
}

export const subscriptionsApi = {
  createSubscription: async (payload: CreateSubscriptionPayload): Promise<ApiResponse<{ subscription: MemberSubscription; payment: Payment; invoice: Invoice }>> => {
    const { data } = await apiClient.post('/subscriptions', payload)
    return data
  },

  getMySubscriptionDetail: async (id: string): Promise<ApiResponse<{ subscription: MemberSubscription; payment: Payment | null; invoice: Invoice | null }>> => {
    const { data } = await apiClient.get(`/subscriptions/${id}/detail`)
    return data
  },

  freezeSubscription: async (id: string, payload: FreezeSubscriptionPayload): Promise<ApiResponse<{ subscription: MemberSubscription }>> => {
    const { data } = await apiClient.post(`/subscriptions/${id}/freeze`, payload)
    return data
  },

  cancelSubscription: async (id: string): Promise<ApiResponse<{ subscription: MemberSubscription }>> => {
    const { data } = await apiClient.post(`/subscriptions/${id}/cancel`)
    return data
  },

  renewSubscription: async (id: string): Promise<ApiResponse<{ subscription: MemberSubscription }>> => {
    const { data } = await apiClient.post(`/subscriptions/${id}/renew`)
    return data
  },

  uploadPaymentProof: async (subscriptionId: string, file: File): Promise<ApiResponse<{ payment: Payment }>> => {
    const formData = new FormData()
    formData.append('image', file)
    const { data } = await apiClient.post(`/subscriptions/${subscriptionId}/proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}
