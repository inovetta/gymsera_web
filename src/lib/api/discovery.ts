import apiClient from './client'
import { ApiResponse, City, GymListing, GymReview } from '@/types'

function normalizeGym(raw: any): GymListing {
  const facilitiesJson: Record<string, boolean> = raw.facilitiesJson ?? {}
  return {
    ...raw,
    name: raw.name ?? raw.title,
    description: raw.description ?? raw.shortDescription,
    featured: raw.featured ?? raw.isFeatured ?? false,
    phone: raw.phone ?? raw.contactPhone,
    averageRating: Number(raw.averageRating) || 0,
    facilities: raw.facilities ?? Object.keys(facilitiesJson).filter((k) => facilitiesJson[k]),
    images: raw.images ?? raw.imagesJson ?? [],
  }
}

export interface GetGymsParams {
  page?: number
  limit?: number
  search?: string
  cityId?: number
  areaId?: number
  genderType?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  featured?: boolean
  sortBy?: 'rating' | 'price' | 'newest'
  sortOrder?: 'asc' | 'desc'
}

export interface GetReviewsParams {
  page?: number
  limit?: number
}

export interface SubmitReviewPayload {
  rating: number
  title: string
  body: string
}

export const discoveryApi = {
  getCities: async (): Promise<ApiResponse<{ cities: City[] }>> => {
    const { data } = await apiClient.get('/discovery/cities')
    return data
  },

  getFeaturedGyms: async (): Promise<ApiResponse<{ gyms: GymListing[] }>> => {
    const { data } = await apiClient.get('/discovery/gyms/featured')
    if (data?.data?.gyms) data.data.gyms = data.data.gyms.map(normalizeGym)
    return data
  },

  getTopRatedGyms: async (): Promise<ApiResponse<{ gyms: GymListing[] }>> => {
    const { data } = await apiClient.get('/discovery/gyms/top-rated')
    if (data?.data?.gyms) data.data.gyms = data.data.gyms.map(normalizeGym)
    return data
  },

  getNearbyGyms: async (lat: number, lng: number, radius = 10): Promise<ApiResponse<{ gyms: GymListing[] }>> => {
    const { data } = await apiClient.get('/discovery/gyms/nearby', { params: { lat, lng, radius } })
    if (data?.data?.gyms) data.data.gyms = data.data.gyms.map(normalizeGym)
    return data
  },

  getGyms: async (params?: GetGymsParams): Promise<ApiResponse<{ gyms: GymListing[] }>> => {
    const { data } = await apiClient.get('/discovery/gyms', { params })
    if (data?.data?.gyms) data.data.gyms = data.data.gyms.map(normalizeGym)
    return data
  },

  getGym: async (id: string): Promise<ApiResponse<GymListing>> => {
    const { data } = await apiClient.get(`/discovery/gyms/${id}`)
    if (data?.data?.gym) {
      const branches = data.data.branches ?? data.data.gym.branches ?? []
      const membershipPlans = data.data.membershipPlans ?? []
      data.data = { ...normalizeGym(data.data.gym), branches, membershipPlans }
    }
    return data
  },

  getGymReviews: async (id: string, params?: GetReviewsParams): Promise<ApiResponse<{ reviews: GymReview[] }>> => {
    const { data } = await apiClient.get(`/discovery/gyms/${id}/reviews`, { params })
    return data
  },

  submitReview: async (id: string, payload: SubmitReviewPayload): Promise<ApiResponse<{ review: GymReview }>> => {
    const { data } = await apiClient.post(`/discovery/gyms/${id}/reviews`, payload)
    return data
  },
}
