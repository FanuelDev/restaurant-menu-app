// frontend/src/app/shared/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import { catchError, throwError } from 'rxjs'
import { AuthService } from '../services/auth.service'

/**
 * Intercepteur fonctionnel (Angular 18) — injecte le Bearer Token sur toutes
 * les requêtes vers /api et redirige vers /admin/login sur 401.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService)
  const router = inject(Router)

  const token = authService.getToken()

  // Ajoute le header Authorization uniquement si on a un token
  const authReq = token
    ? req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      })
    : req

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.clearSession()
        router.navigate(['/admin/login'])
      }
      return throwError(() => error)
    })
  )
}
