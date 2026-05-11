import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import ImageUploadService from '#services/image_upload_service'

const imageService = new ImageUploadService()

export default class StatsController {
  /** GET /api/admin/stats */
  async index({ restaurant, response }: HttpContext) {
    const now = DateTime.now()
    const todayStart   = now.startOf('day').toSQL({ includeOffset: false })!
    const weekStart    = now.minus({ days: 6 }).startOf('day').toSQL({ includeOffset: false })!
    const monthStart   = now.minus({ days: 29 }).startOf('day').toSQL({ includeOffset: false })!
    const prevMonthStart = now.minus({ days: 59 }).startOf('day').toSQL({ includeOffset: false })!

    const rid = restaurant.id

    // ── Compteurs globaux ────────────────────────────────────────────────────
    const [todayRows, weekRows, monthRows, prevMonthRows] = await Promise.all([
      db.from('page_views').where('restaurant_id', rid).where('resource_type', 'menu').where('created_at', '>=', todayStart).count('* as total'),
      db.from('page_views').where('restaurant_id', rid).where('resource_type', 'menu').where('created_at', '>=', weekStart).count('* as total'),
      db.from('page_views').where('restaurant_id', rid).where('resource_type', 'menu').where('created_at', '>=', monthStart).count('* as total'),
      db.from('page_views').where('restaurant_id', rid).where('resource_type', 'menu').where('created_at', '>=', prevMonthStart).where('created_at', '<', monthStart).count('* as total'),
    ])

    const viewsToday     = Number((todayRows[0] as any).total)
    const viewsThisWeek  = Number((weekRows[0] as any).total)
    const viewsThisMonth = Number((monthRows[0] as any).total)
    const viewsPrevMonth = Number((prevMonthRows[0] as any).total)
    const growthPct = viewsPrevMonth === 0
      ? null
      : Math.round(((viewsThisMonth - viewsPrevMonth) / viewsPrevMonth) * 100)

    // ── Vues par jour (30 derniers jours) ────────────────────────────────────
    const rawDaily = await db
      .from('page_views')
      .where('restaurant_id', rid)
      .where('resource_type', 'menu')
      .where('created_at', '>=', monthStart)
      .select(db.raw('DATE(created_at) as date'))
      .count('* as count')
      .groupByRaw('DATE(created_at)')
      .orderBy('date', 'asc')

    // Compléter les jours sans vue à 0
    const dailyMap = new Map<string, number>()
    for (const row of rawDaily) {
      dailyMap.set((row as any).date, Number((row as any).count))
    }
    const dailyViews: { date: string; count: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = now.minus({ days: i }).toISODate()!
      dailyViews.push({ date: d, count: dailyMap.get(d) ?? 0 })
    }

    // ── Top catégories (par nombre de plats disponibles) ────────────────────
    const topCategories = await db
      .from('categories')
      .where('categories.restaurant_id', rid)
      .where('categories.is_visible', true)
      .leftJoin('menu_items', (join) => {
        join.on('menu_items.category_id', '=', 'categories.id')
            .andOnVal('menu_items.is_available', '=', true)
      })
      .select('categories.id', 'categories.name')
      .count('menu_items.id as itemCount')
      .groupBy('categories.id', 'categories.name')
      .orderBy('itemCount', 'desc')
      .limit(5)

    // ── Top plats (badge popular en premier, puis par ordre de menu) ─────────
    const topItems = await db
      .from('menu_items')
      .join('categories', 'categories.id', 'menu_items.category_id')
      .where('menu_items.restaurant_id', rid)
      .where('menu_items.is_available', true)
      .where('categories.is_visible', true)
      .select(
        'menu_items.id',
        'menu_items.name',
        'menu_items.price',
        'menu_items.badge',
        'menu_items.image_key',
        'categories.name as categoryName',
      )
      .orderByRaw(`CASE WHEN menu_items.badge = 'popular' THEN 0 WHEN menu_items.badge IS NOT NULL THEN 1 ELSE 2 END`)
      .orderBy('menu_items.sort_order', 'asc')
      .limit(5)

    // ── Total des ressources ─────────────────────────────────────────────────
    const [catCount, itemCount] = await Promise.all([
      db.from('categories').where('restaurant_id', rid).count('* as total'),
      db.from('menu_items').where('restaurant_id', rid).where('is_available', true).count('* as total'),
    ])

    return response.ok({
      overview: {
        viewsToday,
        viewsThisWeek,
        viewsThisMonth,
        growthPct,
        totalCategories: Number((catCount[0] as any).total),
        totalItems: Number((itemCount[0] as any).total),
      },
      dailyViews,
      topCategories: topCategories.map((c: any) => ({
        id: c.id,
        name: c.name,
        itemCount: Number(c.itemCount),
      })),
      topItems: await Promise.all(topItems.map(async (i: any) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        badge: i.badge,
        imageUrl: await imageService.getUrl(i.image_key ?? null),
        categoryName: i.categoryName,
      }))),
    })
  }
}
