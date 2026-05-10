import { Injectable, inject } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../environments/environment'
import type { AuditLog, PaginatedResponse } from '../models'

export interface AuditLogFilters {
  page?: number
  perPage?: number
  action?: string
  userId?: number
  resourceType?: string
  startDate?: string
  endDate?: string
}

export interface AllLogsFilters extends AuditLogFilters {
  restaurantId?: number
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient)

  /** Admin: logs scoped to the current restaurant */
  getLogs(filters: AuditLogFilters = {}): Observable<PaginatedResponse<AuditLog>> {
    let params = new HttpParams()
    if (filters.page) params = params.set('page', filters.page)
    if (filters.perPage) params = params.set('perPage', filters.perPage)
    if (filters.action) params = params.set('action', filters.action)
    if (filters.userId) params = params.set('userId', filters.userId)
    if (filters.resourceType) params = params.set('resourceType', filters.resourceType)
    if (filters.startDate) params = params.set('startDate', filters.startDate)
    if (filters.endDate) params = params.set('endDate', filters.endDate)

    return this.http.get<PaginatedResponse<AuditLog>>(`${environment.apiUrl}/admin/audit-logs`, { params })
  }

  /** Super admin: all logs across all restaurants */
  getAllLogs(filters: AllLogsFilters = {}): Observable<PaginatedResponse<AuditLog>> {
    let params = new HttpParams()
    if (filters.page) params = params.set('page', filters.page)
    if (filters.perPage) params = params.set('perPage', filters.perPage)
    if (filters.action) params = params.set('action', filters.action)
    if (filters.resourceType) params = params.set('resourceType', filters.resourceType)
    if (filters.restaurantId) params = params.set('restaurantId', filters.restaurantId)
    if (filters.startDate) params = params.set('startDate', filters.startDate)
    if (filters.endDate) params = params.set('endDate', filters.endDate)

    return this.http.get<PaginatedResponse<AuditLog>>(`${environment.apiUrl}/super-admin/audit-logs`, { params })
  }
}
