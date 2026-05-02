// frontend/src/app/shared/guards/auth.guard.ts
import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { AuthService } from '../services/auth.service'

/**
 * Guard fonctionnel (Angular 18) — redirige vers /admin/login si non authentifié.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService)
  const router = inject(Router)

  if (authService.isAuthenticated()) {
    return true
  }

  return router.createUrlTree(['/admin/login'])
}
