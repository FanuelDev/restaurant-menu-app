import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../environments/environment'
import type { RegisterPayload, LoginResponse } from '../models'

@Injectable({ providedIn: 'root' })
export class RegisterService {
  private readonly http = inject(HttpClient)

  register(payload: RegisterPayload): Observable<LoginResponse & { message: string }> {
    return this.http.post<LoginResponse & { message: string }>(`${environment.apiUrl}/register`, payload)
  }

  checkSlug(slug: string): Observable<{ available: boolean; reason?: string }> {
    return this.http.get<{ available: boolean; reason?: string }>(
      `${environment.apiUrl}/register/check-slug`,
      { params: { slug } }
    )
  }
}
