import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import Restaurant from '#models/restaurant'
import Plan from '#models/plan'
import Subscription from '#models/subscription'
import AuditLog from '#models/audit_log'
import AuditService from '#services/audit_service'

const blockValidator = vine.compile(
  vine.object({
    reason: vine.string().trim().minLength(5).maxLength(500),
  })
)

const assignPlanValidator = vine.compile(
  vine.object({
    planSlug: vine.string().trim(),
    billingCycle: vine.enum(['monthly', 'yearly']),
    // Nombre de mois/années offerts (défaut 1)
    duration: vine.number().min(1).max(24).optional(),
    note: vine.string().trim().maxLength(500).optional(),
  })
)

export default class SuperAdminRestaurantsController {
  readonly #auditService = new AuditService()

  /** GET /api/super-admin/restaurants */
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = Math.min(request.input('perPage', 20), 100)
    const search = request.input('search', '')
    const status = request.input('status')

    const query = Restaurant.query()
      .preload('plan')
      .orderBy('created_at', 'desc')

    if (search) {
      query.where((q) => {
        q.where('name', 'like', `%${search}%`).orWhere('slug', 'like', `%${search}%`)
      })
    }

    if (status === 'blocked') query.whereNotNull('blocked_at')
    else if (status === 'active') query.whereNull('blocked_at').where('is_active', true)
    else if (status === 'trial') query.where('subscription_status', 'trialing')

    const restaurants = await query.paginate(page, perPage)

    return response.ok(restaurants)
  }

  /** GET /api/super-admin/restaurants/:id */
  async show({ params, response }: HttpContext) {
    const restaurant = await Restaurant.query()
      .where('id', params.id)
      .preload('plan')
      .firstOrFail()

    const recentLogs = await AuditLog.query()
      .where('restaurant_id', restaurant.id)
      .orderBy('created_at', 'desc')
      .limit(20)

    return response.ok({ restaurant, recentLogs })
  }

  /** POST /api/super-admin/restaurants/:id/block */
  async block({ params, request, response, auth }: HttpContext) {
    const { reason } = await request.validateUsing(blockValidator)
    const restaurant = await Restaurant.findOrFail(params.id)

    if (restaurant.blockedAt) {
      return response.badRequest({ message: 'Ce restaurant est déjà bloqué.' })
    }

    restaurant.isActive = false
    restaurant.blockedAt = DateTime.now()
    restaurant.blockedReason = reason
    restaurant.blockedById = auth.user!.id
    await restaurant.save()

    await this.#auditService.log({
      ctx: { request } as never,
      user: auth.user!,
      restaurantId: restaurant.id,
      action: 'restaurant.blocked',
      resourceType: 'restaurant',
      resourceId: restaurant.id,
      resourceName: restaurant.name,
      newValues: { reason },
    })

    return response.ok({ message: 'Restaurant bloqué.' })
  }

  /** POST /api/super-admin/restaurants/:id/unblock */
  async unblock({ params, request, response, auth }: HttpContext) {
    const restaurant = await Restaurant.findOrFail(params.id)

    if (!restaurant.blockedAt) {
      return response.badRequest({ message: 'Ce restaurant n\'est pas bloqué.' })
    }

    restaurant.isActive = true
    restaurant.blockedAt = null
    restaurant.blockedReason = null
    restaurant.blockedById = null
    await restaurant.save()

    await this.#auditService.log({
      ctx: { request } as never,
      user: auth.user!,
      restaurantId: restaurant.id,
      action: 'restaurant.unblocked',
      resourceType: 'restaurant',
      resourceId: restaurant.id,
      resourceName: restaurant.name,
    })

    return response.ok({ message: 'Restaurant débloqué.' })
  }

  /** POST /api/super-admin/restaurants/:id/assign-plan */
  async assignPlan({ params, request, response, auth }: HttpContext) {
    const { planSlug, billingCycle, duration = 1, note } = await request.validateUsing(assignPlanValidator)

    const restaurant = await Restaurant.findOrFail(params.id)
    const plan = await Plan.findByOrFail('slug', planSlug)

    const now = DateTime.now()
    const periodEnd = billingCycle === 'yearly'
      ? now.plus({ years: duration })
      : now.plus({ months: duration })

    // Annule toute subscription active/pending existante
    await Subscription.query()
      .where('restaurant_id', restaurant.id)
      .whereIn('status', ['active', 'pending', 'trialing'])
      .update({ status: 'canceled', canceled_at: now.toSQL({ includeOffset: false }) })

    // Crée la nouvelle subscription offerte (montant 0)
    await Subscription.create({
      restaurantId: restaurant.id,
      planId: plan.id,
      cinetpayTransactionId: `sa_grant_${Date.now()}`,
      billingCycle,
      status: 'active',
      amountCents: 0,
      currency: restaurant.currency,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    })

    // Met à jour le restaurant
    restaurant.planId = plan.id
    restaurant.subscriptionStatus = 'active'
    restaurant.trialEndsAt = null
    await restaurant.save()

    await restaurant.load('plan')

    await this.#auditService.log({
      ctx: { request } as never,
      user: auth.user!,
      restaurantId: restaurant.id,
      action: 'subscription.granted',
      resourceType: 'restaurant',
      resourceId: restaurant.id,
      resourceName: restaurant.name,
      newValues: {
        planSlug,
        billingCycle,
        duration,
        periodEnd: periodEnd.toISODate(),
        grantedBy: auth.user!.email,
        note: note ?? null,
      },
    })

    return response.ok({ message: `Plan ${plan.name} attribué jusqu'au ${periodEnd.toISODate()}.`, restaurant })
  }
}
