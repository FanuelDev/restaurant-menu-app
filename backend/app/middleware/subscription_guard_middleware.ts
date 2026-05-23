import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { DateTime } from 'luxon'
import Subscription from '#models/subscription'

/**
 * Bloque les requêtes write (POST, PUT, PATCH, DELETE) si le restaurant
 * n'a pas d'abonnement actif et que la période d'essai est expirée.
 * Si un abonnement actif est expiré (currentPeriodEnd < now), le met
 * automatiquement à jour et suspend le restaurant.
 */
export default class SubscriptionGuardMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { restaurant, request, response } = ctx

    // Les lectures (GET) sont toujours autorisées
    if (request.method() === 'GET') return next()

    const status = restaurant.subscriptionStatus

    if (status === 'active') {
      // Vérifie si l'abonnement actif est expiré
      const activeSubscription = await Subscription.query()
        .where('restaurant_id', restaurant.id)
        .where('status', 'active')
        .orderBy('created_at', 'desc')
        .first()

      if (activeSubscription && activeSubscription.currentPeriodEnd && activeSubscription.currentPeriodEnd < DateTime.now()) {
        // Expire l'abonnement
        activeSubscription.status = 'expired'
        await activeSubscription.save()

        // Suspend le restaurant
        restaurant.subscriptionStatus = 'suspended'
        await restaurant.save()

        return response.paymentRequired({
          error: 'Subscription expired',
          upgradeUrl: '/pricing',
        })
      }

      return next()
    }

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
