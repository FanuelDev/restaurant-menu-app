import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Finance guard — Enterprise plan only.
 *
 * Compat rétroactive à 2 niveaux (supprimable après migration 023) :
 *  1. features['financial_management'] → clé canonique (après mig. 022/023)
 *  2. features['api_access']           → clé exclusive Enterprise ; si présente,
 *     la migration n'a pas encore tourné mais le plan est bien Enterprise
 *
 * Note : charge le plan via le restaurant du middleware tenant si disponible,
 * sinon via l'utilisateur (fallback pour les routes sans tenant middleware).
 */
export default class FinanceGuardMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    const user = auth.user!
    await user.load('restaurant', (q) => q.preload('plan'))
    const plan = user.restaurant?.plan

    const features = (plan?.features ?? {}) as Record<string, boolean>
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
