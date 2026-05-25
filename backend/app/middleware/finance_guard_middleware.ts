import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Finance guard — Enterprise plan only.
 *
 * Utilise ctx.restaurant (injecté par le tenant middleware) pour lire le plan
 * déjà chargé — pas de requête SQL supplémentaire.
 *
 * Compat rétroactive à 2 niveaux (supprimable après migration 023) :
 *  1. features['financial_management'] → clé canonique (après mig. 022/023)
 *  2. features['api_access']           → clé exclusive Enterprise ; si présente,
 *     la migration n'a pas encore tourné mais le plan est bien Enterprise
 */
export default class FinanceGuardMiddleware {
  async handle({ restaurant, response }: HttpContext, next: NextFn) {
    await restaurant.load('plan')
    const features = (restaurant.plan?.features ?? {}) as Record<string, boolean>
    const allowed =
      features['financial_management'] === true ||
      features['api_access'] === true          // clé exclusive Enterprise

    if (!allowed) {
      return response.forbidden({
        error: 'Enterprise plan required',
        upgradeUrl: '/pricing',
      })
    }

    return next()
  }
}
