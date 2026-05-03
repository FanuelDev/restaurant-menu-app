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
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient)

  getLogs(filters: AuditLogFilters = {}): Observable<PaginatedResponse<AuditLog>> {
    let params = new HttpParams()
    if (filters.page) params = params.set('page', filters.page)
    if (filters.perPage) params = params.set('perPage', filters.perPage)
    if (filters.action) params = params.set('action', filters.action)
    if (filters.userId) params = params.set('userId', filters.userId)
    if (filters.resourceType) params = params.set('resourceType', filters.resourceType)

    return this.http.get<PaginatedResponse<AuditLog>>(`${environment.apiUrl}/admin/audit-logs`, { params })
  }
}
