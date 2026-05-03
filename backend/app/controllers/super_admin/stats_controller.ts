import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class SuperAdminStatsController {
  /** GET /api/super-admin/stats */
  async index({ response }: HttpContext) {
    const [[restaurants], [users], [activeSubscriptions], [trialRestaurants], [blockedRestaurants]] =
      await Promise.all([
        db.from('restaurants').count('* as total'),
        db.from('users').whereNot('role', 'super_admin').count('* as total'),
        db.from('restaurants').where('subscription_status', 'active').count('* as total'),
        db.from('restaurants').where('subscription_status', 'trialing').count('* as total'),
        db.from('restaurants').whereNotNull('blocked_at').count('* as total'),
      ])

    const planStats = await db
      .from('restaurants')
      .join('plans', 'restaurants.plan_id', 'plans.id')
      .select('plans.name as planName', 'plans.slug as planSlug')
      .count('restaurants.id as count')
      .groupBy('plans.id', 'plans.name', 'plans.slug')
      .orderBy('count', 'desc')

    const recentSignups = await db
      .from('restaurants')
      .select('id', 'name', 'slug', 'subscription_status', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(10)

    return response.ok({
      totals: {
        restaurants: Number((restaurants as { total: number }).total),
        users: Number((users as { total: number }).total),
        activeSubscriptions: Number((activeSubscriptions as { total: number }).total),
        trialRestaurants: Number((trialRestaurants as { total: number }).total),
        blockedRestaurants: Number((blockedRestaurants as { total: number }).total),
      },
      planStats,
      recentSignups,
    })
  }
}
