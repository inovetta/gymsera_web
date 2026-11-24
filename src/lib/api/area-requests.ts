import apiClient from './client'
import { ApiResponse } from '@/types'

/**
 * NEW-265 (the CMS's area-requests client, host side only): a typed area is a pending request until a
 * platform admin approves, merges or rejects it. A form sends `areaId` or `areaRequestId`, never both.
 */
export interface AreaRequestRef {
  id: number
  cityId: number
  name: string
  status: 'pending_review' | 'approved' | 'merged' | 'rejected'
}

export interface SimilarArea {
  name: string
  areaId: number | null
  status: 'approved' | 'pending_review'
}

export interface AreaCheck {
  name: string
  match: { areaId: number; name: string } | null
  similar: SimilarArea[]
  canRequest: boolean
  reason: null | 'area_requests_daily_limit' | 'area_requests_city_limit'
}

/** POST /places/area-requests answers an existing area, or a request (new or the person's own). */
export type AreaRequestAnswer = { area: { id: number; name: string } } | { areaRequest: AreaRequestRef }

export const LIMIT_MESSAGES: Record<string, string> = {
  area_requests_daily_limit: 'You have asked for 5 new areas today. Please try again tomorrow, or pick an area from the list.',
  area_requests_city_limit: 'You have 3 areas waiting for review in this city. Please wait for them, or pick an area from the list.',
}

export const areaRequestsApi = {
  check: async (cityId: number, name: string): Promise<ApiResponse<AreaCheck>> => {
    const { data } = await apiClient.post('/places/area-requests/check', { cityId, name })
    return data
  },

  create: async (cityId: number, name: string, confirmNotListed = false): Promise<ApiResponse<AreaRequestAnswer>> => {
    const { data } = await apiClient.post('/places/area-requests', { cityId, name, ...(confirmNotListed ? { confirmNotListed: true } : {}) })
    return data
  },
}
