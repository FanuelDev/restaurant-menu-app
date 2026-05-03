import { Injectable, signal, computed, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Router } from '@angular/router'
import { tap } from 'rxjs/operators'
import { Observable } from 'rxjs'
import { environment } from '../../../environments/environment'
import type { AuthUser, LoginResponse, Restaurant } from '../models'

const TOKEN_KEY = 'rm_token'
const USER_KEY = 'rm_user'
const RESTAURANT_KEY = 'rm_restaurant'

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient)
  private readonly router = inject(Router)

  private readonly _user = signal<AuthUser | null>(this.loadUser())
  private readonly _token = signal<string | null>(this.loadToken())
  private readonly _restaurant = signal<Restaurant | null>(this.loadRestaurant())

  readonly user = this._user.asReadonly()
  readonly restaurant = this._restaurant.asReadonly()
  readonly isAuthenticated = computed(() => !!this._token())
  readonly isSuperAdmin = computed(() => this._user()?.role === 'super_admin')
  readonly isAdmin = computed(() => this._user()?.role === 'admin')
  readonly isCashier = computed(() => this._user()?.role === 'cashier')

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/forgot-password`, { email })
  }

  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/reset-password`, { token, password })
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          this.persistSession(res.token.value, res.user, res.restaurant)
        })
      )
  }

  logout(): void {
    this.http.delete(`${environment.apiUrl}/auth/logout`).subscribe({
      complete: () => this.clearSession(),
      error: () => this.clearSession(),
    })
  }

  getToken(): string | null {
    return this._token()
  }

  getTenantSlug(): string | null {
    return this._restaurant()?.slug ?? null
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(RESTAURANT_KEY)
    this._token.set(null)
    this._user.set(null)
    this._restaurant.set(null)
    this.router.navigate(['/login'])
  }

  updateRestaurant(restaurant: Restaurant): void {
    this._restaurant.set(restaurant)
    localStorage.setItem(RESTAURANT_KEY, JSON.stringify(restaurant))
  }

  loginFromRegistration(token: string, user: AuthUser, restaurant: Restaurant | null): void {
    this.persistSession(token, user, restaurant)
  }

  private persistSession(token: string, user: AuthUser, restaurant: Restaurant | null): void {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    if (restaurant) localStorage.setItem(RESTAURANT_KEY, JSON.stringify(restaurant))
    this._token.set(token)
    this._user.set(user)
    this._restaurant.set(restaurant)
  }

  private loadToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  }

  private loadUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY)
    try { return raw ? JSON.parse(raw) : null } catch { return null }
  }

  private loadRestaurant(): Restaurant | null {
    const raw = localStorage.getItem(RESTAURANT_KEY)
    try { return raw ? JSON.parse(raw) : null } catch { return null }
  }
}
