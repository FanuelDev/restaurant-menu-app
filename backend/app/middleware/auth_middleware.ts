// backend/app/middleware/auth_middleware.ts
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

/**
 * Middleware d'authentification.
 * Vérifie que le token Bearer est valide avant d'accéder aux routes admin.
 * Renvoie 401 si le token est absent ou invalide.
 */
export default class AuthMiddleware {
  redirectTo = '/api/auth/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo })
    return next()
  }
}
