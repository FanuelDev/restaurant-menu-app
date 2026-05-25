import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Orders guard — plan Pro ou supérieur.
 * L'accès est accordé uniquement si le JSON features contient { orders: true }.
 * Aucun fallback sur le slug : le super admin contrôle entièrement les features via l'UI.
 */
export default class EnterpriseGuardMiddleware {
  async handle({ restaurant, response }: HttpContext, next: NextFn) {
    await restaurant.load('plan')
    const features = (restaurant.plan?.features ?? {}) as Record<string, boolean>
    // Compatibilité rétroactive avec l'ancienne clé 'orders_and_reservations' (avant migration 022)
    if (!features['orders'] && !features['orders_and_reservations']) {
      return response.forbidden({ error: 'Pro plan required', upgradeUrl: '/pricing' })
    }
    return next()
  }
}
