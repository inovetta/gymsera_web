import apiClient from './client'
import { ApiResponse, City } from '@/types'

export const citiesApi = {
  // Every active city. A host registering a gym picks from these; /discovery/cities lists
  // only cities that already have a live gym (BUG-26, Phase 7 P6).
  getAll: async (): Promise<ApiResponse<City[]>> => {
    const { data } = await apiClient.get('/cities')
    return data
  },
}
