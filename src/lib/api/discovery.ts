import apiClient from './client'

/** The gym's payment details, as the API and the app (HostPaymentDetails) name them. */
export interface HostPaymentDetails {
  bankName?: string | null
  accountTitle?: string | null
  accountNumber?: string | null
  iban?: string | null
  branchCode?: string | null
  jazzCashNumber?: string | null
  easyPaisaNumber?: string | null
  additionalInstructions?: string | null
}
import { ApiResponse, Branch, City, GymListing, GymReview, MembershipPlan } from '@/types'

/**
 * A branch card or a business as discovery sends it (API contract v2 §3 BranchCard / BusinessPublic).
 * Travellers see business and branch names only: `organizationName`, `organization` and `tenant` are
 * never read here (enterprise D3), so nothing of them can reach a page.
 */
function normalizeGym(raw: any): GymListing {
  const facilitiesJson: Record<string, boolean> = raw.facilitiesJson ?? {}
  // A branch card names itself "<Business> · <Branch>" (displayName); a business has only its name.
  const name = raw.displayName ?? raw.name
  return {
    ...raw,
    name,
    description: raw.description,
    featured: raw.featured ?? raw.isFeatured ?? false,
    phone: raw.phone ?? raw.contactPhone,
    averageRating: Number(raw.averageRating) || 0,
    // BUG-27: approved reviews only (the API's reviewCount); 0 = "New".
    totalReviews: Number(raw.totalReviews ?? raw.reviewCount) || 0,
    // NEW-145: the API's minPrice, in the listing's currency; none = no price shown.
    startingPrice: raw.startingPrice ?? (Number(raw.minPrice) > 0 ? Number(raw.minPrice) : undefined),
    currency: raw.currency,
    facilities: raw.facilities ?? Object.keys(facilitiesJson).filter((k) => facilitiesJson[k]),
    images: raw.images ?? raw.imagesJson ?? [],
    businessVerified: raw.businessVerified === true,
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

  getFeaturedBranches: async (): Promise<ApiResponse<{ branches: GymListing[] }>> => {
    const { data } = await apiClient.get('/discovery/branches/featured')
    if (data?.data?.branches) data.data.branches = data.data.branches.map(normalizeGym)
    return data
  },

  getTopRatedBranches: async (): Promise<ApiResponse<{ branches: GymListing[] }>> => {
    const { data } = await apiClient.get('/discovery/branches/top-rated')
    if (data?.data?.branches) data.data.branches = data.data.branches.map(normalizeGym)
    return data
  },

  getNearbyBranches: async (lat: number, lng: number, radius = 10): Promise<ApiResponse<{ branches: GymListing[] }>> => {
    const { data } = await apiClient.get('/discovery/branches/nearby', { params: { lat, lng, radius } })
    if (data?.data?.branches) data.data.branches = data.data.branches.map(normalizeGym)
    return data
  },

  getBranches: async (params?: GetGymsParams): Promise<ApiResponse<{ branches: GymListing[] }>> => {
    const { data } = await apiClient.get('/discovery/branches', { params })
    if (data?.data?.branches) data.data.branches = data.data.branches.map(normalizeGym)
    return data
  },

  /** The business's own bank / wallet details for a traveller's transfer (null = none added). Same call as the app. */
  getPaymentDetails: async (businessId: string): Promise<HostPaymentDetails | null> => {
    const { data } = await apiClient.get(`/discovery/businesses/${businessId}/payment-details`)
    return (data?.data?.paymentDetails as HostPaymentDetails | null | undefined) ?? null
  },

  /** GET /discovery/businesses/:businessId → `{ business, membershipPlans }`, branches inside the business. */
  getBusiness: async (businessId: string): Promise<ApiResponse<GymListing & { branches: Branch[]; membershipPlans: MembershipPlan[] }>> => {
    const { data } = await apiClient.get(`/discovery/businesses/${businessId}`)
    if (data?.data?.business) {
      const branches = data.data.business.branches ?? []
      const membershipPlans = data.data.membershipPlans ?? []
      data.data = { ...normalizeGym(data.data.business), branches, membershipPlans }
    }
    return data
  },

  getBusinessReviews: async (businessId: string, params?: GetReviewsParams): Promise<ApiResponse<{ reviews: GymReview[] }>> => {
    const { data } = await apiClient.get(`/discovery/businesses/${businessId}/reviews`, { params })
    return data
  },

  submitReview: async (businessId: string, payload: SubmitReviewPayload): Promise<ApiResponse<{ review: GymReview }>> => {
    const { data } = await apiClient.post(`/discovery/businesses/${businessId}/reviews`, payload)
    return data
  },
}
