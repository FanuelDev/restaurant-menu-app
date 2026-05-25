import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Reservations guard — plan Enterprise uniquement.
 * L'accès est accordé uniquement si le JSON features contient { reservations: true }.
 * Aucun fallback sur le slug : le super admin contrôle les features via l'UI.
 */
export default class ReservationsGuardMiddleware {
  async handle({ restaurant, response }: HttpContext, next: NextFn) {
    await restaurant.load('plan')
    const features = (restaurant.plan?.features ?? {}) as Record<string, boolean>
    if (!features['reservations']) {
      return response.forbidden({ error: 'Enterprise plan required', upgradeUrl: '/pricing' })
    }
    return next()
  }
}
