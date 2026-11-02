import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class SaAnalyticsController {
  /** GET /api/super-admin/analytics/overview */
  async overview({ response }: HttpContext) {
    const now = new Date()
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [realtime, today, week, month, total, totalViews, topPages] = await Promise.all([
      db.from('site_visits')
        .where('created_at', '>=', fiveMinAgo)
        .countDistinct('visitor_id as count')
        .first(),

      db.from('site_visits')
        .where('created_at', '>=', startOfToday)
        .countDistinct('visitor_id as count')
        .first(),

      db.from('site_visits')
        .where('created_at', '>=', sevenDaysAgo)
        .countDistinct('visitor_id as count')
        .first(),

      db.from('site_visits')
        .where('created_at', '>=', thirtyDaysAgo)
        .countDistinct('visitor_id as count')
        .first(),

      db.from('site_visits')
        .countDistinct('visitor_id as count')
        .first(),

      db.from('site_visits')
        .count('* as count')
        .first(),

      db.from('site_visits')
        .where('created_at', '>=', thirtyDaysAgo)
        .select('path')
        .count('* as views')
        .countDistinct('visitor_id as visitors')
        .groupBy('path')
        .orderBy('views', 'desc')
        .limit(10),
    ])

    return response.ok({
      realtime: Number((realtime as any)?.count ?? 0),
      today: Number((today as any)?.count ?? 0),
      week: Number((week as any)?.count ?? 0),
      month: Number((month as any)?.count ?? 0),
      total: Number((total as any)?.count ?? 0),
      totalPageViews: Number((totalViews as any)?.count ?? 0),
      topPages: (topPages as any[]).map((r) => ({
        path: r.path,
        views: Number(r.views),
        visitors: Number(r.visitors),
      })),
    })
  }

  /** GET /api/super-admin/analytics/daily?days=30 */
  async daily({ request, response }: HttpContext) {
    const days = Math.min(Number(request.qs().days ?? 30), 90)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const rows = await db
      .from('site_visits')
      .where('created_at', '>=', since)
      .select(db.raw('DATE(created_at) as date'))
      .count('* as pageViews')
      .countDistinct('visitor_id as visitors')
      .groupByRaw('DATE(created_at)')
      .orderBy('date', 'asc')

    // Fill missing days with zeros
    const map = new Map<string, { visitors: number; pageViews: number }>()
    for (const r of rows as any[]) {
      map.set(r.date, { visitors: Number(r.visitors), pageViews: Number(r.pageViews) })
    }

    const result: { date: string; visitors: number; pageViews: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 10)
      result.push({ date: key, ...(map.get(key) ?? { visitors: 0, pageViews: 0 }) })
    }

    return response.ok(result)
  }
}
