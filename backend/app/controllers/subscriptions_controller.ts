import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Plan from '#models/plan'
import Subscription from '#models/subscription'
import SubscriptionService from '#services/subscription_service'
import AuditService from '#services/audit_service'

const subscribeValidator = vine.compile(
  vine.object({
    planSlug: vine.string().trim(),
    billingCycle: vine.enum(['monthly', 'yearly']),
  })
)

export default class SubscriptionsController {
  readonly #subscriptionService = new SubscriptionService()
  readonly #auditService = new AuditService()

  /** GET /api/admin/subscription — état de l'abonnement courant */
  async show({ restaurant, response }: HttpContext) {
    await restaurant.load('plan')

    const activeSubscription = await Subscription.query()
      .where('restaurant_id', restaurant.id)
      .whereIn('status', ['active', 'trialing', 'pending'])
      .preload('plan')
      .orderBy('created_at', 'desc')
      .first()

    const plans = await Plan.query().where('is_active', true).where('is_public', true).orderBy('sort_order')

    return response.ok({
      restaurant: {
        subscriptionStatus: restaurant.subscriptionStatus,
        trialEndsAt: restaurant.trialEndsAt,
        plan: restaurant.plan,
      },
      activeSubscription,
      availablePlans: plans,
    })
  }

  /** POST /api/admin/subscription — initie un paiement CinetPay */
  async subscribe({ request, response, auth, restaurant }: HttpContext) {
    const { planSlug, billingCycle } = await request.validateUsing(subscribeValidator)
    const plan = await Plan.findByOrFail('slug', planSlug)
    const user = auth.user!

    if (plan.priceMonthlyCents === 0) {
      return response.badRequest({ message: 'Le plan gratuit ne nécessite pas de paiement.' })
    }

    const { paymentUrl, transactionId } = await this.#subscriptionService.initiatePayment({
      restaurant,
      plan,
      billingCycle,
      customerName: user.fullName?.split(' ')[0] ?? 'Client',
      customerSurname: user.fullName?.split(' ').slice(1).join(' ') ?? '',
      customerEmail: user.email,
      customerPhone: user.phone ?? restaurant.phone ?? '0000000000',
    })

    await this.#auditService.log({
      ctx: { request } as never,
      user,
      restaurantId: restaurant.id,
      action: 'subscription.created',
      newValues: { planSlug, billingCycle, transactionId },
    })

    return response.ok({ paymentUrl, transactionId })
  }

  /** DELETE /api/admin/subscription — annule l'abonnement */
  async cancel({ response, auth, restaurant }: HttpContext) {
    await this.#subscriptionService.cancelSubscription(restaurant.id)

    await this.#auditService.log({
      ctx: {} as never,
      user: auth.user!,
      restaurantId: restaurant.id,
      action: 'subscription.canceled',
    })

    return response.ok({ message: 'Abonnement annulé.' })
  }

  /** GET /api/public/plans — liste publique pour la page pricing */
  async publicPlans({ response }: HttpContext) {
    const plans = await Plan.query()
      .where('is_active', true)
      .where('is_public', true)
      .orderBy('sort_order')
    return response.ok(plans)
  }
}
