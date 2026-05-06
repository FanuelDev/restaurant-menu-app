import { Injectable, inject } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../environments/environment'
import type { Restaurant, Plan, PaginatedResponse, SuperAdminStats, AuditLog } from '../models'

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
  }): Observable<{ message: string; restaurant: Restaurant }> {
    return this.http.post<{ message: string; restaurant: Restaurant }>(
      `${environment.apiUrl}/super-admin/restaurants/${restaurantId}/assign-plan`,
      payload
    )
  }
}
