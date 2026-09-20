import apiClient from './client'
import { ApiResponse, BillingPlan } from '@/types'

// GET /host/subscription/current — the same endpoint the mobile app reads
// for "what does this tenant's account currently entitle them to." Reused
// as-is rather than adding a website-specific duplicate.
export interface CurrentTenantSubscription {
  id: string
  platform: 'MANUAL' | 'IOS' | 'ANDROID' | 'STRIPE'
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING_MIGRATION' | 'PENDING_CANCEL' | 'SCHEDULED'
  statusNote?: string | null
  branchCount?: number | null
  amount: number
  billingCycle: string
  startDate: string
  endDate: string
  autoRenew: boolean
  overQuotaCount: number
}

// The one central GymsEra plan catalog — the same BillingPlan rows iOS,
// Android, and the in-app Host Area all read via GET /billing/plans. The
// website never hardcodes a branch tier's price or Stripe Price ID; it
// always asks, exactly like the mobile app does.
export const billingPlansApi = {
  getPlans: async (): Promise<ApiResponse<{ plans: BillingPlan[] }>> => {
    const { data } = await apiClient.get('/billing/plans', { params: { platform: 'web' } })
    return data
  },

  // POST /billing/stripe/checkout-session — the plan is always the
  // GymsEra-selected one from the catalog above; Stripe only performs the
  // billing operation. Returns a Checkout URL to redirect to.
  createCheckoutSession: async (input: {
    billingPlanId: string
    billingCycle: 'MONTHLY' | 'YEARLY'
    successUrl: string
    cancelUrl: string
  }): Promise<ApiResponse<{ url: string; sessionId: string }>> => {
    const { data } = await apiClient.post('/billing/stripe/checkout-session', input)
    return data
  },

  // POST /billing/stripe/portal-session — payment method / invoices /
  // cancellation only; the Portal Configuration behind this has plan
  // changes disabled, so it never offers anything outside the catalog.
  createPortalSession: async (returnUrl: string): Promise<ApiResponse<{ url: string }>> => {
    const { data } = await apiClient.post('/billing/stripe/portal-session', { returnUrl })
    return data
  },

  // POST /billing/stripe/change-plan — for an EXISTING Stripe subscriber
  // only. Updates their subscription's price in place (same subscription
  // id) rather than starting a new checkout, which is what keeps this from
  // ever creating a second, duplicate-billing Stripe subscription. Applies
  // once the resulting webhook confirms it, same as every other purchase.
  changePlan: async (input: { billingPlanId: string; billingCycle: 'MONTHLY' | 'YEARLY' }): Promise<ApiResponse<{ subscriptionId: string; status: string }>> => {
    const { data } = await apiClient.post('/billing/stripe/change-plan', input)
    return data
  },

  getCurrentSubscription: async (): Promise<ApiResponse<CurrentTenantSubscription>> => {
    const { data } = await apiClient.get('/host/subscription/current')
    return data
  },
}
