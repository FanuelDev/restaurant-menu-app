import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class IntelligenceController {
  /** GET /api/super-admin/intelligence — Tableau de bord intelligent temps réel */
  async index({ response }: HttpContext) {
    const now = DateTime.now()
    const toSQL = (dt: DateTime) => dt.toSQL({ includeOffset: false })!

    const [
      trialsExpiringToday,
      trialsExpiring3Days,
      trialsExpiring7Days,
      newSignups24h,
      blockedRecently,
      churnRisk,
      upsellCandidates,
      mrrRows,
      prevMonthRev,
      activeCount,
      trialCount,
      canceledCount,
      recentActions,
    ] = await Promise.all([
      // Trials qui expirent dans les prochaines 24h
      db.from('restaurants')
        .leftJoin('plans', 'restaurants.plan_id', 'plans.id')
        .select(
          'restaurants.id',
          'restaurants.name',
          'restaurants.slug',
          'restaurants.email',
          'restaurants.trial_ends_at as trialEndsAt',
          'restaurants.created_at as createdAt',
          'plans.name as planName',
          'plans.slug as planSlug',
        )
        .where('restaurants.subscription_status', 'trialing')
        .where('restaurants.is_active', true)
        .whereNotNull('restaurants.trial_ends_at')
        .where('restaurants.trial_ends_at', '>=', toSQL(now))
        .where('restaurants.trial_ends_at', '<', toSQL(now.plus({ hours: 24 })))
        .orderBy('restaurants.trial_ends_at', 'asc'),

      // Trials qui expirent dans 3 jours (hors aujourd'hui)
      db.from('restaurants')
        .leftJoin('plans', 'restaurants.plan_id', 'plans.id')
        .select(
          'restaurants.id',
          'restaurants.name',
          'restaurants.slug',
          'restaurants.email',
          'restaurants.trial_ends_at as trialEndsAt',
          'restaurants.created_at as createdAt',
          'plans.name as planName',
          'plans.slug as planSlug',
        )
        .where('restaurants.subscription_status', 'trialing')
        .where('restaurants.is_active', true)
        .whereNotNull('restaurants.trial_ends_at')
        .where('restaurants.trial_ends_at', '>=', toSQL(now.plus({ hours: 24 })))
        .where('restaurants.trial_ends_at', '<', toSQL(now.plus({ days: 3 })))
        .orderBy('restaurants.trial_ends_at', 'asc'),

      // Trials qui expirent dans 7 jours (hors 3 premiers)
      db.from('restaurants')
        .leftJoin('plans', 'restaurants.plan_id', 'plans.id')
        .select(
          'restaurants.id',
          'restaurants.name',
          'restaurants.slug',
          'restaurants.email',
          'restaurants.trial_ends_at as trialEndsAt',
          'restaurants.created_at as createdAt',
          'plans.name as planName',
          'plans.slug as planSlug',
        )
        .where('restaurants.subscription_status', 'trialing')
        .where('restaurants.is_active', true)
        .whereNotNull('restaurants.trial_ends_at')
        .where('restaurants.trial_ends_at', '>=', toSQL(now.plus({ days: 3 })))
        .where('restaurants.trial_ends_at', '<', toSQL(now.plus({ days: 7 })))
        .orderBy('restaurants.trial_ends_at', 'asc'),

      // Nouvelles inscriptions dernières 24h
      db.from('restaurants')
        .select(
          'id',
          'name',
          'slug',
          'email',
          'subscription_status as subscriptionStatus',
          'created_at as createdAt',
          'trial_ends_at as trialEndsAt',
        )
        .where('created_at', '>=', toSQL(now.minus({ hours: 24 })))
        .orderBy('created_at', 'desc'),

      // Restaurants bloqués dans les 7 derniers jours
      db.from('restaurants')
        .select('id', 'name', 'slug', 'email', 'blocked_at as blockedAt', 'blocked_reason as blockedReason')
        .whereNotNull('blocked_at')
        .where('blocked_at', '>=', toSQL(now.minus({ days: 7 })))
        .orderBy('blocked_at', 'desc'),

      // Risque churn : en trial depuis > 10 jours sans souscrire
      db.from('restaurants')
        .leftJoin('plans', 'restaurants.plan_id', 'plans.id')
        .select(
          'restaurants.id',
          'restaurants.name',
          'restaurants.slug',
          'restaurants.email',
          'restaurants.trial_ends_at as trialEndsAt',
          'restaurants.created_at as createdAt',
          'plans.name as planName',
          'plans.slug as planSlug',
        )
        .where('restaurants.subscription_status', 'trialing')
        .where('restaurants.is_active', true)
        .where('restaurants.created_at', '<=', toSQL(now.minus({ days: 10 })))
        .orderBy('restaurants.created_at', 'asc')
        .limit(20),

      // Opportunités upsell : plan Free avec ≥ 10 articles de menu
      db.from('restaurants')
        .join('plans', 'restaurants.plan_id', 'plans.id')
        .join('menu_items', 'menu_items.restaurant_id', 'restaurants.id')
        .where('plans.slug', 'free')
        .where('restaurants.is_active', true)
        .where('restaurants.subscription_status', 'active')
        .select(
          'restaurants.id',
          'restaurants.name',
          'restaurants.slug',
          'restaurants.email',
          'plans.name as planName',
          'plans.slug as planSlug',
        )
        .count('menu_items.id as itemCount')
        .groupBy('restaurants.id', 'restaurants.name', 'restaurants.slug', 'restaurants.email', 'plans.name', 'plans.slug')
        .havingRaw('COUNT(menu_items.id) >= 10')
        .orderBy('itemCount', 'desc')
        .limit(10),

      // MRR actuel (abonnements actifs × prix plan)
      db.from('restaurants')
        .join('subscriptions', (q) => {
          q.on('subscriptions.restaurant_id', '=', 'restaurants.id')
            .andOnVal('subscriptions.status', '=', 'active')
        })
        .join('plans', 'plans.id', '=', 'restaurants.plan_id')
        .where('restaurants.subscription_status', 'active')
        .select(
          db.raw(
            `SUM(CASE WHEN subscriptions.billing_cycle = 'monthly'
                      THEN plans.price_monthly_cents
                      ELSE ROUND(plans.price_yearly_cents / 12) END) as mrrCents`
          )
        ),

      // Revenus du mois précédent (pour croissance MRR)
      db.from('sa_invoices')
        .where('created_at', '>=', toSQL(now.minus({ months: 1 }).startOf('month')))
        .where('created_at', '<', toSQL(now.startOf('month')))
        .sum('amount_paid_cents as total'),

      // Compteurs statuts
      db.from('restaurants').where('subscription_status', 'active').count('* as total'),
      db.from('restaurants').where('subscription_status', 'trialing').count('* as total'),
      db.from('restaurants').whereIn('subscription_status', ['canceled', 'suspended', 'past_due']).count('* as total'),

      // Dernières actions d'audit plateforme (super_admin)
      db.from('audit_logs')
        .where('user_role', 'super_admin')
        .select(
          'id',
          'action',
          'resource_type as resourceType',
          'resource_name as resourceName',
          'user_email as userEmail',
          'created_at as createdAt',
          'restaurant_id as restaurantId',
        )
        .orderBy('created_at', 'desc')
        .limit(10),
    ])

    const active   = Number((activeCount[0] as any)?.total ?? 0)
    const trialing = Number((trialCount[0] as any)?.total ?? 0)
    const canceled = Number((canceledCount[0] as any)?.total ?? 0)
    const total    = active + trialing + canceled

    const mrrCents       = Number((mrrRows[0] as any)?.mrrCents ?? 0)
    const prevMonthCents = Number((prevMonthRev[0] as any)?.total ?? 0)
    const mrrGrowthPct   = prevMonthCents > 0
      ? Math.round(((mrrCents - prevMonthCents) / prevMonthCents) * 100)
      : 0

    const criticalAlertCount =
      (trialsExpiringToday as any[]).length +
      (churnRisk as any[]).length +
      (blockedRecently as any[]).length

    const platformStatus =
      (trialsExpiringToday as any[]).length > 3 || (churnRisk as any[]).length > 10
        ? 'warning'
        : 'healthy'

    return response.ok({
      alerts: {
        trialsExpiringToday,
        trialsExpiring3Days,
        trialsExpiring7Days,
        newSignups24h,
        blockedRecently,
        churnRisk,
        criticalAlertCount,
      },
      insights: {
        mrrCents,
        mrrGrowthPct,
        conversionRate: total > 0 ? Math.round((active / total) * 100) : 0,
        churnRiskCount: (churnRisk as any[]).length,
        upsellCount: (upsellCandidates as any[]).length,
        upsellCandidates,
        recentAdminActions: recentActions,
      },
      platformHealth: { status: platformStatus },
      refreshedAt: now.toISO(),
    })
  }
}
