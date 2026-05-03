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
