import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import Restaurant from '#models/restaurant'
import User from '#models/user'
import Plan from '#models/plan'
import Subscription from '#models/subscription'
import SaInvoice from '#models/sa_invoice'
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
    amountPaidCents: vine.number().min(0).optional(),
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
    else if (status === 'unverified') {
      // Restaurants dont le propriétaire n'a pas encore vérifié son email
      const unverifiedUserIds = await User.query()
        .whereNull('email_verified_at')
        .whereNotNull('restaurant_id')
        .where('role', 'admin')
        .select('restaurant_id')
      const restaurantIds = unverifiedUserIds.map((u) => u.restaurantId).filter(Boolean)
      if (restaurantIds.length) query.whereIn('id', restaurantIds as number[])
      else query.whereRaw('1 = 0') // aucun résultat
    }

    const restaurants = await query.paginate(page, perPage)

    // Enrichir chaque restaurant avec le statut de vérification email du propriétaire
    const restaurantIds = restaurants.all().map((r) => r.id)
    const owners = restaurantIds.length
      ? await User.query()
          .whereIn('restaurant_id', restaurantIds)
          .where('role', 'admin')
          .select('id', 'email', 'email_verified_at', 'is_active', 'restaurant_id', 'full_name')
      : []

    const ownerMap = new Map(owners.map((u) => [u.restaurantId, u]))

    const data = restaurants.all().map((r) => {
      const owner = ownerMap.get(r.id)
      return {
        ...r.serialize(),
        owner: owner
          ? {
              id: owner.id,
              email: owner.email,
              fullName: owner.fullName,
              emailVerifiedAt: owner.emailVerifiedAt?.toISO() ?? null,
              isActive: owner.isActive,
            }
          : null,
      }
    })

    return response.ok({
      data,
      meta: restaurants.getMeta(),
    })
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

    const owner = await User.query()
      .where('restaurant_id', restaurant.id)
      .where('role', 'admin')
      .select('id', 'email', 'full_name', 'email_verified_at', 'is_active', 'created_at')
      .first()

    return response.ok({
      restaurant: {
        ...restaurant.serialize(),
        owner: owner
          ? {
              id: owner.id,
              email: owner.email,
              fullName: owner.fullName,
              emailVerifiedAt: owner.emailVerifiedAt?.toISO() ?? null,
              isActive: owner.isActive,
            }
          : null,
      },
      recentLogs,
    })
  }

  /** POST /api/super-admin/restaurants/:id/verify-user
   *  Active manuellement le compte (email vérifié + compte actif) */
  async verifyUser({ params, request, response, auth }: HttpContext) {
    const restaurant = await Restaurant.findOrFail(params.id)

    const owner = await User.query()
      .where('restaurant_id', restaurant.id)
      .where('role', 'admin')
      .firstOrFail()

    if (owner.emailVerifiedAt) {
      return response.badRequest({ message: 'Cet email est déjà vérifié.' })
    }

    owner.emailVerifiedAt = DateTime.now()
    owner.isActive = true
    // Invalider le token de vérification s'il en existe un
    owner.emailVerificationToken = null
    owner.emailVerificationTokenExpiresAt = null
    await owner.save()

    await this.#auditService.log({
      ctx: { request } as never,
      user: auth.user!,
      restaurantId: restaurant.id,
      action: 'user.email_verified_by_admin',
      resourceType: 'user',
      resourceId: owner.id,
      resourceName: owner.email,
      newValues: {
        verifiedAt: owner.emailVerifiedAt.toISO(),
        grantedBy: auth.user!.email,
      },
    })

    return response.ok({
      message: `Compte de ${owner.email} activé manuellement.`,
      owner: {
        id: owner.id,
        email: owner.email,
        emailVerifiedAt: owner.emailVerifiedAt.toISO(),
        isActive: owner.isActive,
      },
    })
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
    const { planSlug, billingCycle, duration = 1, note, amountPaidCents = 0 } = await request.validateUsing(assignPlanValidator)

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

    // Crée la nouvelle subscription
    const subscription = await Subscription.create({
      restaurantId: restaurant.id,
      planId: plan.id,
      cinetpayTransactionId: `sa_grant_${Date.now()}`,
      billingCycle,
      status: 'active',
      amountCents: amountPaidCents,
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

    // Génère la facture
    const year = now.year.toString()
    const month = now.month.toString().padStart(2, '0')
    const countResult = await SaInvoice.query().count('id as total')
    const count = Number((countResult[0] as any).$extras.total) + 1

    const invoiceNumber = `FAC-${year}${month}-${count.toString().padStart(5, '0')}`

    const durationMonths = billingCycle === 'yearly' ? duration * 12 : duration
    const originalPriceCents = billingCycle === 'yearly'
      ? plan.priceYearlyCents * duration
      : plan.priceMonthlyCents * duration

    const invoice = await SaInvoice.create({
      invoiceNumber,
      restaurantId: restaurant.id,
      subscriptionId: subscription.id,
      grantedBy: auth.user!.id,
      planName: plan.name,
      planSlug: plan.slug,
      billingCycle,
      durationMonths,
      amountPaidCents,
      originalPriceCents,
      currency: restaurant.currency,
      notes: note ?? null,
      periodStart: now,
      periodEnd,
    })

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
        amountPaidCents,
        invoiceNumber,
      },
    })

    return response.ok({ message: `Plan ${plan.name} attribué jusqu'au ${periodEnd.toISODate()}.`, restaurant, invoice })
  }
}
