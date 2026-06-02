import { Injectable, inject } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../environments/environment'
import type { Restaurant, Plan, PaginatedResponse, SuperAdminStats, AuditLog, SaInvoice, SaRevenueStats } from '../models'

export interface RestaurantFilters {
  page?: number
  perPage?: number
  search?: string
  status?: 'active' | 'blocked' | 'trial'
}

@Injectable({ providedIn: 'root' })
export class SuperAdminService {
  private readonly http = inject(HttpClient)

  getStats(): Observable<SuperAdminStats> {
    return this.http.get<SuperAdminStats>(`${environment.apiUrl}/super-admin/stats`)
  }

  getRestaurants(filters: RestaurantFilters = {}): Observable<PaginatedResponse<Restaurant>> {
    let params = new HttpParams()
    if (filters.page) params = params.set('page', filters.page)
    if (filters.perPage) params = params.set('perPage', filters.perPage)
    if (filters.search) params = params.set('search', filters.search)
    if (filters.status) params = params.set('status', filters.status)
    return this.http.get<PaginatedResponse<Restaurant>>(`${environment.apiUrl}/super-admin/restaurants`, { params })
  }

  getRestaurant(id: number): Observable<{ restaurant: Restaurant; recentLogs: AuditLog[] }> {
    return this.http.get<{ restaurant: Restaurant; recentLogs: AuditLog[] }>(`${environment.apiUrl}/super-admin/restaurants/${id}`)
  }

  blockRestaurant(id: number, reason: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/super-admin/restaurants/${id}/block`, { reason })
  }

  unblockRestaurant(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/super-admin/restaurants/${id}/unblock`, {})
  }

  verifyUser(restaurantId: number): Observable<{ message: string; owner: import('../models').RestaurantOwner }> {
    return this.http.post<{ message: string; owner: import('../models').RestaurantOwner }>(
      `${environment.apiUrl}/super-admin/restaurants/${restaurantId}/verify-user`, {}
    )
  }

  getPlans(): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${environment.apiUrl}/super-admin/plans`)
  }

  createPlan(payload: Partial<Plan>): Observable<Plan> {
    return this.http.post<Plan>(`${environment.apiUrl}/super-admin/plans`, payload)
  }

  updatePlan(id: number, payload: Partial<Plan>): Observable<Plan> {
    return this.http.put<Plan>(`${environment.apiUrl}/super-admin/plans/${id}`, payload)
  }

  deletePlan(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/super-admin/plans/${id}`)
  }

  assignPlan(restaurantId: number, payload: {
    planSlug: string
    billingCycle: 'monthly' | 'yearly'
    duration?: number
    note?: string
    amountPaidCents?: number
  }): Observable<{ message: string; restaurant: Restaurant; invoice: SaInvoice }> {
    return this.http.post<{ message: string; restaurant: Restaurant; invoice: SaInvoice }>(
      `${environment.apiUrl}/super-admin/restaurants/${restaurantId}/assign-plan`,
      payload
    )
  }

  getInvoices(params?: { restaurantId?: number; page?: number }): Observable<{ data: SaInvoice[]; meta: any }> {
    let httpParams = new HttpParams()
    if (params?.restaurantId) httpParams = httpParams.set('restaurantId', params.restaurantId)
    if (params?.page) httpParams = httpParams.set('page', params.page)
    return this.http.get<{ data: SaInvoice[]; meta: any }>(`${environment.apiUrl}/super-admin/invoices`, { params: httpParams })
  }

  getInvoice(id: number): Observable<SaInvoice> {
    return this.http.get<SaInvoice>(`${environment.apiUrl}/super-admin/invoices/${id}`)
  }

  getRevenue(): Observable<SaRevenueStats> {
    return this.http.get<SaRevenueStats>(`${environment.apiUrl}/super-admin/revenue`)
  }
}
