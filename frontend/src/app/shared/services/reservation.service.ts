import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../environments/environment'
import type { Reservation, CreateReservationPayload } from '../models'

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly http = inject(HttpClient)
  private readonly base = environment.apiUrl

  createReservation(payload: CreateReservationPayload): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.base}/public/reservations`, payload)
  }

  getAdminReservations(params: { status?: string; date?: string; page?: number }): Observable<{ data: Reservation[]; meta: { total: number; perPage: number; currentPage: number; lastPage: number } }> {
    return this.http.get<any>(`${this.base}/admin/reservations`, { params: params as any })
  }

  updateReservationStatus(id: number, status: string, notes?: string): Observable<Reservation> {
    return this.http.patch<Reservation>(`${this.base}/admin/reservations/${id}/status`, { status, notes })
  }
}
