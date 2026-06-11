import apiClient from './client'
import { ApiResponse, PlatformPackage } from '@/types'

export const packagesApi = {
  getPackages: async (): Promise<ApiResponse<PlatformPackage[]>> => {
    const { data } = await apiClient.get('/platform-packages')
    return data
  },

  getPackage: async (id: string): Promise<ApiResponse<PlatformPackage>> => {
    const { data } = await apiClient.get(`/platform-packages/${id}`)
    return data
  },
}
