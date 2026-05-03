import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { DateTime } from 'luxon'

/**
 * Bloque les requêtes write (POST, PUT, PATCH, DELETE) si le restaurant
 * n'a pas d'abonnement actif et que la période d'essai est expirée.
 */
export default class SubscriptionGuardMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { restaurant, request, response } = ctx

    // Les lectures (GET) sont toujours autorisées
    if (request.method() === 'GET') return next()

    const status = restaurant.subscriptionStatus

    if (status === 'active') return next()

    if (status === 'trialing') {
      const expired = restaurant.trialEndsAt && restaurant.trialEndsAt < DateTime.now()
      if (!expired) return next()

      return response.paymentRequired({
        message: 'Période d\'essai expirée. Veuillez souscrire à un abonnement.',
        trialEndedAt: restaurant.trialEndsAt,
        upgradeUrl: '/admin/subscription',
      })
    }

    return response.paymentRequired({
      message: 'Abonnement inactif. Veuillez régulariser votre situation.',
      status,
      upgradeUrl: '/admin/subscription',
    })
  }
}
