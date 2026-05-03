import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { UserRole } from '#models/user'

/**
 * Vérifie que l'utilisateur connecté a l'un des rôles autorisés.
 * Doit être utilisé APRÈS le middleware auth().
 *
 * Usage : middleware.role('admin')  ou  middleware.role('admin', 'cashier')
 */
export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, allowedRoles: UserRole[]) {
    const { auth, response } = ctx

    const user = auth.user!

    if (!allowedRoles.includes(user.role)) {
      return response.forbidden({
        message: 'Accès refusé — droits insuffisants.',
        required: allowedRoles,
        current: user.role,
      })
    }

    if (!user.isActive) {
      return response.forbidden({ message: 'Compte désactivé.' })
    }

    return next()
  }
}
