import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { AuthService } from '../services/auth.service'

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService)
  const router = inject(Router)

  if (authService.isAuthenticated()) return true
  return router.createUrlTree(['/login'])
}

export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService)
  const router = inject(Router)

  if (!authService.isAuthenticated()) return router.createUrlTree(['/login'])
  if (authService.isSuperAdmin()) return true
  return router.createUrlTree(['/admin'])
}

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService)
  const router = inject(Router)

  if (!authService.isAuthenticated()) return router.createUrlTree(['/login'])
  const role = authService.user()?.role
  if (role === 'admin' || role === 'cashier') return true
  return router.createUrlTree(['/'])
}

/**
 * Bloque l'accès à une route si le plan du restaurant ne correspond pas.
 * Redirige vers /admin/subscription si insuffisant.
 *
 * Utilisation :
 *   canActivate: [planGuard('enterprise')]
 *   canActivate: [planGuard('pro', 'enterprise')]
 */
export const planGuard = (...requiredPlans: string[]): CanActivateFn => () => {
  const authService = inject(AuthService)
  const router      = inject(Router)

  if (!authService.isAuthenticated()) return router.createUrlTree(['/login'])

  const plan     = authService.restaurant()?.plan
  const slug     = plan?.slug ?? ''
  const features = (plan as any)?.features ?? {}

  // Vérifie le slug du plan ET les feature flags éventuels
  const allowed =
    requiredPlans.includes(slug) ||
    (requiredPlans.includes('pro')        && !!features['orders_and_reservations']) ||
    (requiredPlans.includes('enterprise') && !!features['financial_management'])

  if (allowed) return true
  return router.createUrlTree(['/admin/subscription'])
}
