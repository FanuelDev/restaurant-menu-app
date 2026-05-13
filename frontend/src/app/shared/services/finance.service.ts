import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../environments/environment'
import type {
  FinanceSummary,
  FinanceChart,
  FinanceExpense,
  FinanceIncome,
  FinancePeriod,
  PaginatedResponse,
} from '../models'

export interface ExpensePayload {
  category: 'ingredient' | 'tool' | 'accessory' | 'other'
  label: string
  amount: number
  date: string
  notes?: string
}

export interface IncomePayload {
  label: string
  amount: number
  date: string
  notes?: string
}

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly http = inject(HttpClient)
  private readonly base = `${environment.apiUrl}/admin/finance`

  getSummary(period: FinancePeriod): Observable<FinanceSummary> {
    return this.http.get<FinanceSummary>(`${this.base}/summary`, { params: { period } })
  }

  getChart(period: FinancePeriod): Observable<FinanceChart> {
    return this.http.get<FinanceChart>(`${this.base}/chart`, { params: { period } })
  }

  listExpenses(params: { page?: number; category?: string; from?: string; to?: string }): Observable<PaginatedResponse<FinanceExpense>> {
    return this.http.get<PaginatedResponse<FinanceExpense>>(`${this.base}/expenses`, { params: params as any })
  }

  createExpense(data: ExpensePayload): Observable<FinanceExpense> {
    return this.http.post<FinanceExpense>(`${this.base}/expenses`, data)
  }

  updateExpense(id: number, data: ExpensePayload): Observable<FinanceExpense> {
    return this.http.put<FinanceExpense>(`${this.base}/expenses/${id}`, data)
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/expenses/${id}`)
  }

  listIncomes(params: { page?: number; from?: string; to?: string }): Observable<PaginatedResponse<FinanceIncome>> {
    return this.http.get<PaginatedResponse<FinanceIncome>>(`${this.base}/incomes`, { params: params as any })
  }

  createIncome(data: IncomePayload): Observable<FinanceIncome> {
    return this.http.post<FinanceIncome>(`${this.base}/incomes`, data)
  }

  updateIncome(id: number, data: IncomePayload): Observable<FinanceIncome> {
    return this.http.put<FinanceIncome>(`${this.base}/incomes/${id}`, data)
  }

  deleteIncome(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/incomes/${id}`)
  }
}
