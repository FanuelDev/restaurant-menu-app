// backend/app/controllers/super_admin/revenue_controller.ts
// Vue analytique complète des revenus de la plateforme — lecture seule.

import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class SaRevenueController {
  /** GET /api/super-admin/revenue */
  async index({ response }: HttpContext) {
    const twelveMonthsAgo = DateTime.now().minus({ months: 11 }).startOf('month').toSQL({ includeOffset: false })!

    const [
      totalRevenueRow,
      revenueByPlan,
      mrrRows,
      monthlyRevenue,
      monthlySignups,
      activeCount,
      trialCount,
      canceledCount,
      suspendedCount,
      totalRestaurantsRow,
      topRestaurants,
    ] = await Promise.all([

      // ── Total revenus collectés (toutes factures) ─────────────
      db.from('sa_invoices').sum('amount_paid_cents as total'),

      // ── Revenus par plan ──────────────────────────────────────
      db
        .from('sa_invoices')
        .select('plan_name as planName', 'plan_slug as planSlug')
        .sum('amount_paid_cents as revenueCents')
        .count('* as invoiceCount')
        .groupBy('plan_slug', 'plan_name')
        .orderBy('revenueCents', 'desc'),

      // ── MRR : abonnements actifs × prix plan ──────────────────
      db
        .from('restaurants')
        .join('subscriptions', (q) => {
          q.on('subscriptions.restaurant_id', '=', 'restaurants.id')
            .andOnVal('subscriptions.status', '=', 'active')
        })
        .join('plans', 'plans.id', '=', 'restaurants.plan_id')
        .where('restaurants.subscription_status', 'active')
        .select(
          'subscriptions.billing_cycle as billingCycle',
          db.raw(
            `SUM(CASE WHEN subscriptions.billing_cycle = 'monthly'
                      THEN plans.price_monthly_cents
                      ELSE ROUND(plans.price_yearly_cents / 12) END) as mrrCents`
          )
        )
        .groupBy('subscriptions.billing_cycle'),

      // ── Historique mensuel des revenus (12 mois) ──────────────
      db
        .from('sa_invoices')
        .where('created_at', '>=', twelveMonthsAgo)
        .select(
          db.raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
          db.raw('SUM(amount_paid_cents) as revenueCents'),
          db.raw('COUNT(*) as invoiceCount')
        )
        .groupByRaw("DATE_FORMAT(created_at, '%Y-%m')")
        .orderBy('month', 'asc'),

      // ── Inscriptions mensuelles (12 mois) ────────────────────
      db
        .from('restaurants')
        .where('created_at', '>=', twelveMonthsAgo)
        .select(
          db.raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
          db.raw('COUNT(*) as count')
        )
        .groupByRaw("DATE_FORMAT(created_at, '%Y-%m')")
        .orderBy('month', 'asc'),

      // ── Statuts abonnements ───────────────────────────────────
      db.from('restaurants').where('subscription_status', 'active').count('* as total'),
      db.from('restaurants').where('subscription_status', 'trialing').count('* as total'),
      db.from('restaurants').whereIn('subscription_status', ['canceled', 'expired']).count('* as total'),
      db.from('restaurants').where('subscription_status', 'suspended').count('* as total'),
      db.from('restaurants').count('* as total'),

      // ── Top 5 restaurants par revenus ─────────────────────────
      db
        .from('sa_invoices')
        .join('restaurants', 'restaurants.id', '=', 'sa_invoices.restaurant_id')
        .select(
          'sa_invoices.restaurant_id as restaurantId',
          'restaurants.name as restaurantName',
          'restaurants.slug as restaurantSlug',
          'restaurants.subscription_status as subscriptionStatus'
        )
        .sum('sa_invoices.amount_paid_cents as totalCents')
        .count('sa_invoices.id as invoiceCount')
        .groupBy('sa_invoices.restaurant_id', 'restaurants.name', 'restaurants.slug', 'restaurants.subscription_status')
        .orderBy('totalCents', 'desc')
        .limit(10),
    ])

    // ── Calcul MRR total ─────────────────────────────────────────
    const mrrCents = (mrrRows as any[]).reduce(
      (sum, row) => sum + Number(row.mrrCents || 0),
      0
    )

    // ── Remplissage des 12 mois manquants (revenus) ───────────────
    const revenueMap = new Map(
      (monthlyRevenue as any[]).map((r) => [r.month, { revenueCents: Number(r.revenueCents), invoiceCount: Number(r.invoiceCount) }])
    )
    const signupMap = new Map(
      (monthlySignups as any[]).map((r) => [r.month, Number(r.count)])
    )

    const months: { month: string; label: string; revenueCents: number; invoiceCount: number; signupCount: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const dt   = DateTime.now().minus({ months: i })
      const key  = dt.toFormat('yyyy-MM')
      const label = dt.toFormat('MMM yy', { locale: 'fr' })
      months.unshift({
        month:        key,
        label,
        revenueCents: revenueMap.get(key)?.revenueCents  ?? 0,
        invoiceCount: revenueMap.get(key)?.invoiceCount  ?? 0,
        signupCount:  signupMap.get(key) ?? 0,
      })
    }
    // Remettre dans l'ordre chronologique (unshift les a inversés)
    months.reverse()
    months.reverse() // double-reverse = ordre correct (unshift puis reverse une fois)

    const totalCents = Number((totalRevenueRow[0] as any)?.total ?? 0)

    return response.ok({
      totalRevenueCents: totalCents,
      mrrCents,
      arrCents: mrrCents * 12,
      avgRevenuePerRestaurantCents:
        Number((totalRestaurantsRow[0] as any)?.total ?? 0) > 0
          ? Math.round(totalCents / Number((totalRestaurantsRow[0] as any).total))
          : 0,

      revenueByPlan: (revenueByPlan as any[]).map((r) => ({
        planName:     r.planName,
        planSlug:     r.planSlug,
        revenueCents: Number(r.revenueCents),
        invoiceCount: Number(r.invoiceCount),
        pct:
          totalCents > 0
            ? Math.round((Number(r.revenueCents) / totalCents) * 100)
            : 0,
      })),

      months,

      conversion: {
        total:     Number((totalRestaurantsRow[0] as any)?.total ?? 0),
        active:    Number((activeCount[0] as any)?.total ?? 0),
        trialing:  Number((trialCount[0] as any)?.total ?? 0),
        canceled:  Number((canceledCount[0] as any)?.total ?? 0),
        suspended: Number((suspendedCount[0] as any)?.total ?? 0),
      },

      topRestaurants: (topRestaurants as any[]).map((r) => ({
        restaurantId:       Number(r.restaurantId),
        restaurantName:     r.restaurantName,
        restaurantSlug:     r.restaurantSlug,
        subscriptionStatus: r.subscriptionStatus,
        totalCents:         Number(r.totalCents),
        invoiceCount:       Number(r.invoiceCount),
      })),
    })
  }
}
