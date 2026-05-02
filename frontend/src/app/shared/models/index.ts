// frontend/src/app/shared/models/index.ts

export interface Restaurant {
  id: number
  name: string
  slogan: string | null
  brandColor: string
  logoUrl: string | null
  address: string | null
  phone: string | null
  email: string | null
  openingHours: Record<string, DaySchedule> | null
}

export interface DaySchedule {
  open: string
  close: string
  closed?: boolean
}

export type MenuItemBadge = 'new' | 'popular' | 'vegetarian' | 'spicy' | null

export interface Category {
  id: number
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

export interface AuthUser {
  id: number
  email: string
  fullName: string | null
  role: 'admin' | 'staff'
}

export interface AuthToken {
  type: 'bearer'
  value: string
  expiresAt: string | null
}

export interface LoginResponse {
  token: AuthToken
  user: AuthUser
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

/** Filtres disponibles côté vitrine client */
export interface MenuFilters {
  badge: MenuItemBadge | 'all'
  search: string
}
