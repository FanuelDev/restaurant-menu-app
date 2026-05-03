import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import { catchError, throwError } from 'rxjs'
import { AuthService } from '../services/auth.service'

/** Extracts subdomain from hostname (e.g. "bistrot.localhost" → "bistrot"). */
function extractSubdomainFromHostname(): string | null {
  const hostname = window.location.hostname
  const parts = hostname.split('.')
  const reserved = new Set(['www', 'api', 'admin', 'app', 'localhost', ''])
  if (parts.length < 2) return null
  const sub = parts[0]
  return reserved.has(sub) ? null : sub
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService)
  const router = inject(Router)

  const token = authService.getToken()
  // Prefer authenticated tenant slug, fall back to subdomain from URL (for public pages)
  const tenantSlug = authService.getTenantSlug() ?? extractSubdomainFromHostname()

  let headers = req.headers
  if (token) headers = headers.set('Authorization', `Bearer ${token}`)
  if (tenantSlug) headers = headers.set('X-Tenant-Slug', tenantSlug)

  const authReq = headers !== req.headers ? req.clone({ headers }) : req

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.clearSession()
        router.navigate(['/login'])
      }
      return throwError(() => error)
    })
  )
}
