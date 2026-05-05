// ─── Core menu models ──────────────────────────────────────────────────────
export interface DaySchedule {
  open: string
  close: string
  closed?: boolean
}

export type MenuItemBadge = 'new' | 'popular' | 'vegetarian' | 'spicy' | null

export interface Category {
  id: number
  restaurantId?: number
  name: string
  description: string | null
  sortOrder: number
  isVisible: boolean
  menuItemsCount?: number
  menuItems?: MenuItem[]
}

export interface MenuItem {
  id: number
  categoryId: number
  restaurantId?: number
  category?: Category
  name: string
  description: string | null
  priceInCents: number
  priceFormatted?: string
  imageUrl: string | null
  isAvailable: boolean
  badge: MenuItemBadge
  sortOrder: number
}

// ─── SaaS / Multi-tenant models ────────────────────────────────────────────
export type UserRole = 'super_admin' | 'admin' | 'cashier'
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'suspended'
export type BillingCycle = 'monthly' | 'yearly'

export interface Plan {
  id: number
  name: string
  slug: string
  description: string | null
  priceMonthlyCents: number
  priceYearlyCents: number
  maxCategories: number
  maxMenuItems: number
  maxUsers: number
  features: Record<string, boolean> | null
  isActive: boolean
  isPublic: boolean
  sortOrder: number
}

export interface Restaurant {
  id: number
  slug: string
  name: string
  slogan: string | null
  brandColor: string
  logoUrl: string | null
  coverImageUrl?: string | null
  address: string | null
  phone: string | null
  email: string | null
  website?: string | null
  country: string
  currency: string
  openingHours: Record<string, DaySchedule> | null
  subscriptionStatus: SubscriptionStatus
  trialEndsAt: string | null
  plan?: Plan | null
  isActive?: boolean
  blockedAt?: string | null
  blockedReason?: string | null
  createdAt?: string
}

export interface Subscription {
  id: number
  restaurantId: number
  planId: number
  plan?: Plan
  cinetpayTransactionId: string
  billingCycle: BillingCycle
  status: 'pending' | 'active' | 'canceled' | 'expired'
  amountCents: number
  currency: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  canceledAt: string | null
  createdAt: string
}

export interface TeamMember {
  id: number
  restaurantId: number
  fullName: string
  email: string
  role: 'cashier'
  phone: string | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface AuditLog {
  id: number
  restaurantId: number
  userId: number | null
  userEmail: string
  userRole: UserRole
  action: string
  resourceType: string | null
  resourceId: number | null
  resourceName: string | null
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: string
}

// ─── Auth models ────────────────────────────────────────────────────────────
export interface AuthUser {
  id: number
  email: string
  fullName: string | null
  role: UserRole
  restaurantId: number | null
}

export interface AuthToken {
  type: 'bearer'
  value: string
  expiresAt: string | null
}

export interface LoginResponse {
  token: AuthToken
  user: AuthUser
  restaurant: Restaurant | null
}

// ─── Registration ───────────────────────────────────────────────────────────
export interface RegisterPayload {
  restaurantName: string
  restaurantSlug: string
  country: string
  currency: string
  address?: string
  phone?: string
  website?: string
  fullName: string
  email: string
  password: string
  password_confirmation: string
  ownerPhone?: string
  planSlug?: string
}

// ─── Subscription payment ───────────────────────────────────────────────────
export interface SubscribePayload {
  planSlug: string
  billingCycle: BillingCycle
}

export interface InitPaymentResponse {
  paymentUrl: string
  transactionId: string
}

// ─── Pagination ─────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
    firstPage: number
  }
}

// ─── Misc ────────────────────────────────────────────────────────────────────
export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

export interface MenuFilters {
  badge: MenuItemBadge | 'all'
  search: string
}

export interface SuperAdminStats {
  totals: {
    restaurants: number
    users: number
    activeSubscriptions: number
    trialRestaurants: number
    blockedRestaurants: number
  }
  planStats: { planName: string; planSlug: string; count: number }[]
  recentSignups: { id: number; name: string; slug: string; subscriptionStatus: SubscriptionStatus; createdAt: string }[]
}
