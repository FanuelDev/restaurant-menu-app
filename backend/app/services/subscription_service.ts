import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Plan from '#models/plan'
import Restaurant from '#models/restaurant'
import Subscription from '#models/subscription'
import FedaPayService from '#services/fedapay_service'
import { mailService } from '#services/mail_service'
import User from '#models/user'

const TRIAL_DAYS = 14

export default class SubscriptionService {
  readonly #fedapay = new FedaPayService()

  /** Attache le plan Free et démarre la période d'essai lors de la création du restaurant */
  async startTrial(restaurant: Restaurant): Promise<void> {
    const freePlan = await Plan.findByOrFail('slug', 'free')
    restaurant.planId = freePlan.id
    restaurant.subscriptionStatus = 'trialing'
    restaurant.trialEndsAt = DateTime.now().plus({ days: TRIAL_DAYS })
    await restaurant.save()
  }

  /** Vérifie si le restaurant peut créer une ressource selon les limites du plan */
  async checkLimit(
    restaurant: Restaurant,
    resource: 'categories' | 'menu_items' | 'users'
  ): Promise<{ allowed: boolean; current: number; max: number }> {
    await restaurant.load('plan')
    const plan = restaurant.plan

    if (!plan) return { allowed: true, current: 0, max: -1 }

    const maxMap = {
      categories: plan.maxCategories,
      menu_items: plan.maxMenuItems,
      users: plan.maxUsers,
    }
    const max = maxMap[resource]
    if (max === -1) return { allowed: true, current: 0, max: -1 }

    const countMap = {
      categories: () => db.from('categories').where('restaurant_id', restaurant.id).count('* as total'),
      menu_items: () => db.from('menu_items').where('restaurant_id', restaurant.id).count('* as total'),
      users: () => db.from('users').where('restaurant_id', restaurant.id).where('role', 'cashier').count('* as total'),
    }

    const rows = await countMap[resource]()
    const current = Number((rows[0] as { total: string | number }).total)

    return { allowed: current < max, current, max }
  }

  /** Retourne l'usage courant des 3 ressources limitées par le plan */
  async getUsage(restaurant: Restaurant): Promise<{
    categories: { current: number; max: number; allowed: boolean }
    menuItems: { current: number; max: number; allowed: boolean }
    users: { current: number; max: number; allowed: boolean }
  }> {
    const [categories, menuItems, users] = await Promise.all([
      this.checkLimit(restaurant, 'categories'),
      this.checkLimit(restaurant, 'menu_items'),
      this.checkLimit(restaurant, 'users'),
    ])
    return { categories, menuItems, users }
  }

  /** Initie un paiement FedaPay (Mobile Money / Carte) pour un abonnement */
  async initiatePayment(params: {
    restaurant: Restaurant
    plan: Plan
    billingCycle: 'monthly' | 'yearly'
    customerName: string
    customerSurname: string
    customerEmail: string
    customerPhone: string
  }): Promise<{ paymentUrl: string; transactionId: string }> {
    const amountCents =
      params.billingCycle === 'yearly'
        ? params.plan.priceYearlyCents
        : params.plan.priceMonthlyCents

    const result = await this.#fedapay.initPayment({
      amountCents,
      currency: 'XOF',
      description: `Abonnement ${params.plan.name} — ${params.billingCycle === 'yearly' ? 'Annuel' : 'Mensuel'}`,
      customerFirstname: params.customerName,
      customerLastname:  params.customerSurname,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      metadata: {
        restaurantId: params.restaurant.id,
        planId: params.plan.id,
        billingCycle: params.billingCycle,
      },
    })

    await Subscription.create({
      paymentProvider: 'fedapay',
      restaurantId: params.restaurant.id,
      planId: params.plan.id,
      fedapayTransactionId: result.transactionId,
      fedapayPaymentToken: result.paymentToken,
      billingCycle: params.billingCycle,
      status: 'pending',
      amountCents,
      currency: 'XOF',
    })

    return { paymentUrl: result.paymentUrl, transactionId: result.transactionId }
  }

  /** Appelé par le webhook FedaPay — active l'abonnement après paiement confirmé */
  async activateSubscription(fedapayTransactionId: string, rawData: Record<string, unknown>): Promise<void> {
    const subscription = await Subscription.findByOrFail('fedapayTransactionId', fedapayTransactionId)

    if (subscription.status === 'active') return

    const plan = await Plan.findOrFail(subscription.planId)

    const now = DateTime.now()
    const periodEnd = subscription.billingCycle === 'yearly'
      ? now.plus({ years: 1 })
      : now.plus({ months: 1 })

    await db.transaction(async (trx) => {
      subscription.useTransaction(trx)
      subscription.status = 'active'
      subscription.currentPeriodStart = now
      subscription.currentPeriodEnd = periodEnd
      subscription.paymentMetadata = rawData
      await subscription.save()

      const restaurant = await Restaurant.findOrFail(subscription.restaurantId)
      restaurant.useTransaction(trx)
      restaurant.planId = plan.id
      restaurant.subscriptionStatus = 'active'
      restaurant.trialEndsAt = null
      await restaurant.save()
    })

    const owner = await User.query().where('restaurant_id', subscription.restaurantId).where('role', 'admin').first()
    if (owner) {
      const restaurant = await Restaurant.findOrFail(subscription.restaurantId)
      const invoiceNumber = `INV-FP-${fedapayTransactionId.slice(-8).toUpperCase()}`
      const periodEndFmt = periodEnd.setLocale('fr').toLocaleString(DateTime.DATE_FULL)
      mailService.sendSubscriptionActivated(
        owner.email,
        owner.fullName ?? owner.email,
        restaurant.name,
        plan.name,
        periodEndFmt,
        invoiceNumber
      ).catch((err) => console.error('[Mail] Erreur envoi subscription activated :', err))
    }
  }

  /** Annule un abonnement (fin de période) */
  async cancelSubscription(restaurantId: number): Promise<void> {
    const subscription = await Subscription.query()
      .where('restaurant_id', restaurantId)
      .whereIn('status', ['active', 'trialing'])
      .firstOrFail()

    subscription.status = 'canceled'
    subscription.canceledAt = DateTime.now()
    await subscription.save()

    const restaurant = await Restaurant.findOrFail(restaurantId)
    restaurant.subscriptionStatus = 'canceled'
    await restaurant.save()
  }
}
