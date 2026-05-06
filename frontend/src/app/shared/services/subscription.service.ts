import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../environments/environment'
import type { Plan, Subscription, SubscribePayload, InitPaymentResponse, PlanUsage } from '../models'

export interface SubscriptionShowResponse {
  restaurant: { subscriptionStatus: string; trialEndsAt: string | null; plan: Plan | null }
  activeSubscription: Subscription | null
  availablePlans: Plan[]
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly http = inject(HttpClient)

  getSubscription(): Observable<SubscriptionShowResponse> {
    return this.http.get<SubscriptionShowResponse>(`${environment.apiUrl}/admin/subscription`)
  }

  subscribe(payload: SubscribePayload): Observable<InitPaymentResponse> {
    return this.http.post<InitPaymentResponse>(`${environment.apiUrl}/admin/subscription`, payload)
  }

  cancel(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/admin/subscription`)
  }

  getPublicPlans(): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${environment.apiUrl}/public/plans`)
  }

  getUsage(): Observable<PlanUsage> {
    return this.http.get<PlanUsage>(`${environment.apiUrl}/admin/usage`)
  }
}
