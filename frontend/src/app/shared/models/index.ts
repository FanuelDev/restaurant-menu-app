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
  /** Traductions du nom par code langue : { en: '...', de: '...', zh: '...' } */
  nameTranslations?: Record<string, string>
  /** Traductions de la description par code langue */
  descriptionTranslations?: Record<string, string>
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
  /** Traductions du nom par code langue : { en: '...', de: '...', zh: '...' } */
  nameTranslations?: Record<string, string>
  /** Traductions de la description par code langue */
  descriptionTranslations?: Record<string, string>
  price: number
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

export interface ResourceUsage {
  current: number
  max: number
  allowed: boolean
}

export interface PlanUsage {
  categories: ResourceUsage
  menuItems: ResourceUsage
  users: ResourceUsage
}

export interface RestaurantOwner {
  id: number
  email: string
  fullName: string | null
  emailVerifiedAt: string | null
  isActive: boolean
}

export interface Restaurant {
  id: number
  slug: string
  name: string
  slogan: string | null
  brandColor: string
  templateId?: number
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
  /** Propriétaire du restaurant (admin) — enrichi par le super admin API */
  owner?: RestaurantOwner | null
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
  restaurant?: { id: number; name: string; slug: string }
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

// ─── Stats ───────────────────────────────────────────────────────────────────
export interface StatsOverview {
  viewsToday: number
  viewsThisWeek: number
  viewsThisMonth: number
  growthPct: number | null
  totalCategories: number
  totalItems: number
}

export interface DailyView {
  date: string
  count: number
}

export interface StatsTopCategory {
  id: number
  name: string
  itemCount: number
}

export interface StatsTopItem {
  id: number
  name: string
  price: number
  badge: MenuItemBadge
  imageUrl: string | null
  categoryName: string
}

export interface StatsData {
  overview: StatsOverview
  dailyViews: DailyView[]
  topCategories: StatsTopCategory[]
  topItems: StatsTopItem[]
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'no_show'

export interface CartItem {
  menuItem: MenuItem
  quantity: number
  specialInstructions: string
}

export interface OrderItem {
  id: number
  orderId: number
  menuItemId: number | null
  menuItemName: string
  menuItemPrice: number
  quantity: number
  specialInstructions: string | null
  subtotal: number
}

export interface Order {
  id: number
  restaurantId: number
  orderNumber: string
  customerName: string
  customerPhone: string | null
  customerEmail: string | null
  status: OrderStatus
  notes: string | null
  total: number
  isGift: boolean
  giftMessage: string | null
  giftToken: string | null
  giftRedeemedAt: string | null
  giftRedeemedBy: string | null
  giftRedeemedContact: string | null
  giftRevokedAt: string | null
  items: OrderItem[]
  createdAt: string
}

export interface Reservation {
  id: number
  restaurantId: number
  customerName: string
  customerPhone: string
  customerEmail: string | null
  reservedDate: string
  reservedTime: string
  guestsCount: number
  specialRequests: string | null
  status: ReservationStatus
  notes: string | null
  createdAt: string
}

export interface PlaceOrderPayload {
  customerName: string
  customerPhone: string | null
  customerEmail: string | null
  notes: string | null
  isGift: boolean
  giftMessage: string | null
  items: { menuItemId: number; quantity: number; specialInstructions: string | null }[]
}

export interface CreateReservationPayload {
  customerName: string
  customerPhone: string
  customerEmail: string | null
  reservedDate: string
  reservedTime: string
  guestsCount: number
  specialRequests: string | null
}

export interface AdminCreateOrderPayload {
  customerName:  string
  customerPhone: string | null
  customerEmail: string | null
  notes:         string | null
  status?:       'pending' | 'confirmed' | 'preparing' | 'ready'
  items: { menuItemId: number; quantity: number; specialInstructions: string | null }[]
}

export interface AdminCreateReservationPayload {
  customerName:    string
  customerPhone:   string
  customerEmail:   string | null
  reservedDate:    string
  reservedTime:    string
  guestsCount:     number
  specialRequests: string | null
  notes:           string | null
  status?:         'pending' | 'confirmed'
}

// ─── Finance ─────────────────────────────────────────────────────────────────
export type ExpenseCategory = 'ingredient' | 'tool' | 'accessory' | 'other'
export type FinancePeriod = 'day' | 'week' | 'month' | 'semester' | 'year'

export interface FinanceExpense {
  id: number
  restaurantId: number
  createdBy: number | null
  category: ExpenseCategory
  label: string
  amount: number
  date: string
  notes: string | null
  createdAt: string
}

export interface FinanceIncome {
  id: number
  restaurantId: number
  createdBy: number | null
  label: string
  amount: number
  date: string
  notes: string | null
  createdAt: string
}

export interface FinanceSummary {
  period: FinancePeriod
  totalRevenue: number
  ordersRevenue: number
  manualRevenue: number
  totalExpenses: number
  netProfit: number
  marginPct: number
  byCategory: { ingredient: number; tool: number; accessory: number; other: number }
  trends: { revenue: number | null; expenses: number | null; net: number | null }
}

export interface FinanceChartPoint {
  label: string
  revenue: number
  ordersRevenue: number
  manualRevenue: number
  expenses: number
  net: number
}

export interface FinanceOrderRevenue {
  id: number
  orderNumber: string
  customerName: string
  total: number
  createdAt: string
}

export interface FinanceChart {
  period: FinancePeriod
  groupBy: 'hour' | 'day' | 'month'
  points: FinanceChartPoint[]
}

// ─── SA Invoices ─────────────────────────────────────────────────────────────
export interface SaInvoice {
  id: number
  invoiceNumber: string
  restaurantId: number
  restaurant?: {
    id: number
    name: string
    slug: string
    address: string | null
    phone: string | null
    email: string | null
    website: string | null
    country: string
    currency: string
  }
  subscriptionId: number | null
  grantedBy: number | null
  granter?: { id: number; email: string; fullName?: string | null }
  planName: string
  planSlug: string
  billingCycle: 'monthly' | 'yearly'
  durationMonths: number
  amountPaidCents: number
  originalPriceCents: number
  currency: string
  notes: string | null
  periodStart: string
  periodEnd: string
  createdAt: string
}

// ─── API Keys ────────────────────────────────────────────────────────────────
export interface ApiKeyItem {
  id: number
  name: string
  keyPrefix: string
  isActive: boolean
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export interface ApiKeyCreated extends ApiKeyItem {
  /** Clé complète — affichée une seule fois à la création */
  key: string
}

// ─── Super Admin Intelligence ────────────────────────────────────────────────
export interface SaAlertRestaurant {
  id: number
  name: string
  slug: string
  email: string | null
  trialEndsAt?: string | null
  createdAt?: string
  planName?: string | null
  planSlug?: string | null
  subscriptionStatus?: SubscriptionStatus
  blockedAt?: string | null
  blockedReason?: string | null
  itemCount?: number
}

export interface SaIntelligence {
  alerts: {
    trialsExpiringToday: SaAlertRestaurant[]
    trialsExpiring3Days: SaAlertRestaurant[]
    trialsExpiring7Days: SaAlertRestaurant[]
    newSignups24h: SaAlertRestaurant[]
    blockedRecently: SaAlertRestaurant[]
    churnRisk: SaAlertRestaurant[]
    criticalAlertCount: number
  }
  insights: {
    mrrCents: number
    mrrGrowthPct: number
    conversionRate: number
    churnRiskCount: number
    upsellCount: number
    upsellCandidates: SaAlertRestaurant[]
    recentAdminActions: {
      id: number
      action: string
      resourceType: string | null
      resourceName: string | null
      userEmail: string
      createdAt: string
      restaurantId: number
    }[]
  }
  platformHealth: { status: 'healthy' | 'warning' | 'critical' }
  refreshedAt: string
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

export interface SaRevenueStats {
  totalRevenueCents: number
  mrrCents: number
  arrCents: number
  avgRevenuePerRestaurantCents: number
  revenueByPlan: {
    planName: string
    planSlug: string
    revenueCents: number
    invoiceCount: number
    pct: number
  }[]
  months: {
    month: string
    label: string
    revenueCents: number
    invoiceCount: number
    signupCount: number
  }[]
  conversion: {
    total: number
    active: number
    trialing: number
    canceled: number
    suspended: number
  }
  topRestaurants: {
    restaurantId: number
    restaurantName: string
    restaurantSlug: string
    subscriptionStatus: string
    totalCents: number
    invoiceCount: number
  }[]
}
