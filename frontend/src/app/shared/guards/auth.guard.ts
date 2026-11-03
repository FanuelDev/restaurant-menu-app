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
 * Bloque l'accès à une route si la feature n'est pas activée dans le plan.
 * Redirige vers /admin/subscription si insuffisant.
 *
 * Utilisation :
 *   canActivate: [featureGuard('orders')]
 *   canActivate: [featureGuard('api_access')]
 */
export const featureGuard = (featureKey: string): CanActivateFn => () => {
  const authService = inject(AuthService)
  const router      = inject(Router)

  if (!authService.isAuthenticated()) return router.createUrlTree(['/login'])

  const features = ((authService.restaurant()?.plan as any)?.features ?? {}) as Record<string, boolean>
  if (features[featureKey] === true) return true
  return router.createUrlTree(['/admin/subscription'])
}

/** @deprecated Utiliser featureGuard à la place */
export const planGuard = (...requiredPlans: string[]): CanActivateFn => () => {
  const authService = inject(AuthService)
  const router      = inject(Router)

  if (!authService.isAuthenticated()) return router.createUrlTree(['/login'])

  const plan     = authService.restaurant()?.plan
  const slug     = plan?.slug ?? ''
  const features = (plan as any)?.features ?? {}

  const allowed =
    requiredPlans.includes(slug) ||
    (requiredPlans.includes('pro')        && !!features['orders_and_reservations']) ||
    (requiredPlans.includes('enterprise') && !!features['financial_management'])

  if (allowed) return true
  return router.createUrlTree(['/admin/subscription'])
}
