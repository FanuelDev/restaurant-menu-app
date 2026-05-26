import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Marketing guard — Enterprise plan uniquement.
 *
 * Compat rétroactive à 2 niveaux :
 *  1. features['marketing']   → clé canonique (après migration 025)
 *  2. features['api_access']  → clé exclusive Enterprise ; si présente,
 *     la migration n'a pas encore tourné mais le plan est bien Enterprise
 */
export default class MarketingGuardMiddleware {
  async handle({ restaurant, response }: HttpContext, next: NextFn) {
    await restaurant.load('plan')
    const features = (restaurant.plan?.features ?? {}) as Record<string, boolean>
    const allowed =
      features['marketing'] === true ||
      features['api_access'] === true

    if (!allowed) {
      return response.forbidden({
        error: 'Enterprise plan required',
        upgradeUrl: '/pricing',
      })
    }

    return next()
  }
}
