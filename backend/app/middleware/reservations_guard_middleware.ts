import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Reservations guard — plan Enterprise uniquement.
 *
 * Compat rétroactive à 3 niveaux (supprimable après migration 023) :
 *  1. features['reservations']          → clé canonique (après mig. 022/023)
 *  2. features['orders_and_reservations'] → ancienne clé unique Pro/Enterprise
 *  3. features['api_access']            → clé exclusive Enterprise ; si présente
 *     la migration 023 n'a pas encore tourné mais le plan est bien Enterprise
 */
export default class ReservationsGuardMiddleware {
  async handle({ restaurant, response }: HttpContext, next: NextFn) {
    await restaurant.load('plan')
    const features = (restaurant.plan?.features ?? {}) as Record<string, boolean>
    const allowed =
      features['reservations'] === true ||
      features['orders_and_reservations'] === true ||
      features['api_access'] === true          // clé exclusive Enterprise
    if (!allowed) {
      return response.forbidden({ error: 'Enterprise plan required', upgradeUrl: '/pricing' })
    }
    return next()
  }
}
