// frontend/src/app/shared/services/auth.service.ts
import { Injectable, signal, computed, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Router } from '@angular/router'
import { tap } from 'rxjs/operators'
import { Observable } from 'rxjs'
import { environment } from '../../../environments/environment'
import type { AuthUser, LoginResponse } from '../models'

const TOKEN_KEY = 'rm_token'
const USER_KEY = 'rm_user'

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient)
  private readonly router = inject(Router)

  // ── Signals d'état ────────────────────────────────────────────────────────
  private readonly _user = signal<AuthUser | null>(this.loadUser())
  private readonly _token = signal<string | null>(this.loadToken())

  readonly user = this._user.asReadonly()
  readonly isAuthenticated = computed(() => !!this._token())

  // ── API calls ─────────────────────────────────────────────────────────────
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          this.persistSession(res.token.value, res.user)
        })
      )
  }

  logout(): void {
    this.http.delete(`${environment.apiUrl}/auth/logout`).subscribe({
      complete: () => this.clearSession(),
      error: () => this.clearSession(),
    })
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getToken(): string | null {
    return this._token()
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    this._token.set(null)
    this._user.set(null)
    this.router.navigate(['/admin/login'])
  }

  private persistSession(token: string, user: AuthUser): void {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    this._token.set(token)
    this._user.set(user)
  }

  private loadToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  }

  private loadUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY)
    try {
      return raw ? (JSON.parse(raw) as AuthUser) : null
    } catch {
      return null
    }
  }
}
