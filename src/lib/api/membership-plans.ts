import apiClient from './client'
import { ApiResponse, MembershipPlan } from '@/types'

export const membershipPlansApi = {
  getPublicPlans: async (gymListingId: string): Promise<ApiResponse<{ plans: MembershipPlan[] }>> => {
    const { data } = await apiClient.get('/membership-plans', { params: { gymListingId } })
    return data
  },

  getPlan: async (id: string): Promise<ApiResponse<{ plan: MembershipPlan }>> => {
    const { data } = await apiClient.get(`/membership-plans/${id}`)
    return data
  },
}
