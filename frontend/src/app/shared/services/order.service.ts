import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../environments/environment'
import type { Order, PlaceOrderPayload } from '../models'

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient)
  private readonly base = environment.apiUrl

  /** Check if restaurant has Enterprise orders feature */
  checkFeature(): Observable<{ ordersAndReservations: boolean }> {
    return this.http.get<{ ordersAndReservations: boolean }>(`${this.base}/public/features`)
  }

  /** Place an order (guest checkout) */
  placeOrder(payload: PlaceOrderPayload): Observable<Order> {
    return this.http.post<Order>(`${this.base}/public/orders`, payload)
  }

  /** Get order by order number (for confirmation page) */
  getOrder(orderNumber: string): Observable<Order> {
    return this.http.get<Order>(`${this.base}/public/orders/${orderNumber}`)
  }

  /** Get gift order info (for redeem page) */
  getRedeemInfo(token: string): Observable<{ order: Order; alreadyRedeemed: boolean; restaurantName: string }> {
    return this.http.get<{ order: Order; alreadyRedeemed: boolean; restaurantName: string }>(`${this.base}/public/redeem/${token}`)
  }

  /** Claim/redeem gift order */
  redeemGift(token: string, redeemerName: string, redeemerContact: string): Observable<Order> {
    return this.http.post<Order>(`${this.base}/public/redeem/${token}`, { redeemerName, redeemerContact })
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  getAdminOrders(params: { status?: string; isGift?: boolean; search?: string; page?: number }): Observable<{ data: Order[]; meta: { total: number; perPage: number; currentPage: number; lastPage: number } }> {
    return this.http.get<any>(`${this.base}/admin/orders`, { params: params as any })
  }

  updateOrderStatus(id: number, status: string): Observable<Order> {
    return this.http.patch<Order>(`${this.base}/admin/orders/${id}/status`, { status })
  }

  revokeGift(id: number): Observable<Order> {
    return this.http.post<Order>(`${this.base}/admin/orders/${id}/revoke-gift`, {})
  }

  scanToken(token: string): Observable<Order> {
    return this.http.get<Order>(`${this.base}/admin/orders/scan/${token}`)
  }
}
