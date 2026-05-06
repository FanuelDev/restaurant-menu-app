import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class EnterpriseGuardMiddleware {
  async handle({ restaurant, response }: HttpContext, next: NextFn) {
    await restaurant.load('plan')
    const plan = restaurant.plan
    const hasFeature =
      plan?.features?.['orders_and_reservations'] === true || plan?.slug === 'enterprise'
    if (!hasFeature) {
      return response.forbidden({ error: 'Enterprise plan required', upgradeUrl: '/pricing' })
    }
    return next()
  }
}
