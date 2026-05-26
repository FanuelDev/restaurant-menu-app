import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../environments/environment'
import type { PaginatedResponse } from '../models'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MarketingVoucherUsage {
  id: number
  voucherId: number
  orderId: number | null
  customerName: string
  voucherAmountUsed: number
  orderTotal: number
  surplusPaid: number
  redeemedAt: string
}

export interface MarketingVoucher {
  id: number
  restaurantId: number
  label: string
  eventType: 'after_work' | 'birthday' | 'christmas' | 'easter' | 'new_year' | 'other'
  amount: number
  validFrom: string
  validUntil: string
  maxUsages: number | null
  usageCount: number
  qrToken: string
  notes: string | null
  status: 'active' | 'expired' | 'fully_used'
  createdAt: string
  usages?: MarketingVoucherUsage[]
}

export interface MarketingStats {
  totalVouchers: number
  activeVouchers: number
  totalRedemptions: number
  totalValueRedeemed: number
}

export interface CreateVoucherPayload {
  label: string
  eventType: 'after_work' | 'birthday' | 'christmas' | 'easter' | 'new_year' | 'other'
  amount: number
  validFrom: string
  validUntil: string
  maxUsages?: number | null
  notes?: string | null
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class MarketingService {
  private readonly http = inject(HttpClient)
  private readonly base = `${environment.apiUrl}/admin/marketing`

  getStats(): Observable<MarketingStats> {
    return this.http.get<MarketingStats>(`${this.base}/stats`)
  }

  listVouchers(params?: { page?: number; status?: string }): Observable<PaginatedResponse<MarketingVoucher>> {
    return this.http.get<PaginatedResponse<MarketingVoucher>>(`${this.base}/vouchers`, {
      params: (params ?? {}) as Record<string, string | number>,
    })
  }

  createVoucher(data: CreateVoucherPayload): Observable<MarketingVoucher> {
    return this.http.post<MarketingVoucher>(`${this.base}/vouchers`, data)
  }

  updateVoucher(id: number, data: Partial<CreateVoucherPayload>): Observable<MarketingVoucher> {
    return this.http.patch<MarketingVoucher>(`${this.base}/vouchers/${id}`, data)
  }

  deleteVoucher(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/vouchers/${id}`)
  }

  getVoucher(id: number): Observable<MarketingVoucher> {
    return this.http.get<MarketingVoucher>(`${this.base}/vouchers/${id}`)
  }

  redeemVoucher(
    id: number,
    data: { customerName: string; orderTotal: number; orderId?: number },
  ): Observable<{ usage: MarketingVoucherUsage; voucherAmountUsed: number; surplusPaid: number; message: string }> {
    return this.http.post<any>(`${this.base}/vouchers/${id}/redeem`, data)
  }
}
