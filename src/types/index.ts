export type UserRole = 'MEMBER' | 'TRAINER' | 'BRANCH_MANAGER' | 'GYM_HOST' | 'PLATFORM_ADMIN'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
export type TenantStatus = 'PENDING_REVIEW' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'ACTIVE'
export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'FROZEN' | 'EXPIRED' | 'CANCELLED'
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'WALLET' | 'ONLINE' | 'POS'
export type InvoiceStatus = 'ISSUED' | 'PAID' | 'CANCELLED' | 'OVERDUE'
export type PlanDurationType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type GenderType = 'MALE' | 'FEMALE' | 'MIXED'
export type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'YEARLY'

export interface User {
  id: string
  fullName: string
  email: string
  phone?: string
  role: UserRole
  status: UserStatus
  isVerified: boolean
  profileImageUrl?: string
  lastLoginAt?: string
  createdAt: string
  // Extended profile fields
  gender?: string
  dateOfBirth?: string
  height?: number
  weight?: number
  fitnessGoal?: string
  allergies?: string
  foodPreferences?: string
}

export interface Tenant {
  id: string
  userId: string
  businessName: string
  email: string
  phone: string
  cityId: number
  status: TenantStatus
  selectedPackageId?: string
  createdAt: string
  user?: User
  city?: City
}

export interface City {
  id: number
  name: string
  isActive: boolean
  createdAt: string
  areas?: Area[]
  gymCount?: number
}

export interface Area {
  id: number
  cityId: number
  name: string
}

export interface GymListing {
  id: string
  tenantId: string
  name: string
  description?: string
  latitude?: number
  longitude?: number
  averageRating: number
  totalReviews?: number
  logoUrl?: string
  coverImageUrl?: string
  genderType: GenderType
  status: string
  featured: boolean
  address?: string
  phone?: string
  email?: string
  openingTime?: string
  closingTime?: string
  facilities?: string[]
  images?: string[]
  imagesJson?: string[]
  branchId?: string
  city?: City
  area?: Area
  branches?: Branch[]
  startingPrice?: number
}

export interface Branch {
  id: string
  gymId: string
  branchName: string
  address: string
  cityId: number
  areaId?: number
  latitude?: number | string
  longitude?: number | string
  phone?: string
  openingTime?: string
  closingTime?: string
  facilities: string[] | Record<string, boolean>
  images: string[]
  status: string
  city?: City
  area?: Area
}

export interface MembershipPlan {
  id: string
  gymId: string
  branchId?: string
  name: string
  description?: string
  durationType: PlanDurationType
  durationValue: number
  price: number
  joiningFee: number
  securityFee: number
  visitLimit?: number
  freezeLimitDays: number
  isTrial: boolean
  status: string
  posterUrl?: string
  branch?: Branch
  features?: string[]
}

export interface MemberSubscription {
  id: string
  userId: string
  branchId: string
  membershipPlanId: string
  startDate: string
  endDate: string
  status: SubscriptionStatus
  autoRenew: boolean
  qrCode?: string
  remainingVisits?: number
  freezeFrom?: string
  freezeTo?: string
  sourceChannel?: string
  subscriptionId?: string
  gymName?: string
  planName?: string
  tenantId?: string
  gymListingId?: string
  user?: User
  branch?: Branch
  membershipPlan?: MembershipPlan
  gymListing?: GymListing
}

export interface AttendanceLog {
  id: string
  userId: string
  branchId: string
  subscriptionId?: string
  checkInTime: string
  checkOutTime?: string
  user?: User
  branch?: Branch
}

export interface Payment {
  id: string
  userId: string
  subscriptionId?: string
  paymentFor: string
  amount: number
  currency: string
  method: PaymentMethod
  status: PaymentStatus
  proofUrl?: string
  notes?: string
  createdAt: string
  user?: User
}

export interface Invoice {
  id: string
  userId: string
  invoiceNo: string
  invoiceType: string
  subtotal: number
  totalAmount: number
  status: InvoiceStatus
  dueDate?: string
  paidAt?: string
  createdAt: string
  user?: User
}

export interface Trainer {
  id: string
  userId: string
  specialization: string
  bio?: string
  yearsExperience: number
  certifications: string[]
  status: string
  user?: User
}

export interface GymReview {
  id: string
  gymListingId: string
  userId: string
  rating: number
  title: string
  body: string
  status: ReviewStatus
  createdAt: string
  user?: User
  gymListing?: GymListing
}

export interface PlatformPackage {
  id: string
  name: string
  description?: string
  price: number
  billingCycle: BillingCycle
  maxBranches: number
  maxTrainers: number
  maxMembers: number
  featureFlags: Record<string, boolean>
  status: string
}

export interface AccountStatementEntry {
  id: string
  type: 'SUBSCRIPTION' | 'PAYMENT' | 'INVOICE'
  description: string
  amount: number
  status: string
  date: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  pagination?: Pagination
}

export interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}
