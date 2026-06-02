import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../environments/environment'
import type { RegisterPayload, LoginResponse } from '../models'

export interface RegisterPendingResponse {
  requiresVerification: true
  email: string
  message: string
}

export interface VerifyEmailResponse extends LoginResponse {
  message: string
}

@Injectable({ providedIn: 'root' })
export class RegisterService {
  private readonly http = inject(HttpClient)

  register(payload: RegisterPayload): Observable<RegisterPendingResponse> {
    return this.http.post<RegisterPendingResponse>(`${environment.apiUrl}/register`, payload)
  }

  verifyEmail(email: string, code: string): Observable<VerifyEmailResponse> {
    return this.http.post<VerifyEmailResponse>(`${environment.apiUrl}/register/verify-email`, { email, code })
  }

  resendVerification(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/register/resend-verification`, { email })
  }

  checkSlug(slug: string): Observable<{ available: boolean; reason?: string }> {
    return this.http.get<{ available: boolean; reason?: string }>(
      `${environment.apiUrl}/register/check-slug`,
      { params: { slug } }
    )
  }
}
