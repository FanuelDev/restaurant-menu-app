import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Finance guard — Enterprise plan only.
 * Blocks access unless the restaurant's plan slug is exactly 'enterprise'
 * or the plan features include 'financial_management'.
 */
export default class FinanceGuardMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    const user = auth.user!
    await user.load('restaurant', (q) => q.preload('plan'))
    const plan = user.restaurant?.plan

    const hasFeature =
      plan?.slug === 'enterprise' ||
      plan?.features?.['financial_management'] === true

    if (!hasFeature) {
      return response.forbidden({
        error: 'Enterprise plan required',
        upgradeUrl: '/pricing',
      })
    }

    return next()
  }
}
