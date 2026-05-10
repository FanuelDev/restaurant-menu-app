import type { HttpContext } from '@adonisjs/core/http'
import AuditLog from '#models/audit_log'

const VALID_ACTIONS = new Set([
  'category.created', 'category.updated', 'category.deleted', 'category.reordered',
  'menu_item.created', 'menu_item.updated', 'menu_item.deleted', 'menu_item.toggled',
  'user.created', 'user.updated', 'user.deleted',
  'restaurant.updated', 'restaurant.logo_uploaded',
  'subscription.created', 'subscription.canceled', 'subscription.granted',
  'restaurant.blocked', 'restaurant.unblocked',
  'order.created', 'order.status_updated', 'order.gift_revoked',
  'reservation.created', 'reservation.status_updated',
])

const VALID_RESOURCE_TYPES = new Set([
  'category', 'menu_item', 'user', 'restaurant', 'subscription', 'order', 'reservation',
])

/** Validate a YYYY-MM-DD date string — returns null if invalid */
function parseDate(raw: unknown): string | null {
  const s = String(raw ?? '').trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
}

export default class AuditLogsController {
  /** GET /api/admin/audit-logs — scoped to the current restaurant only */
  async index({ request, response, restaurant }: HttpContext) {
    const page = Math.max(1, Number(request.input('page', 1)) || 1)
    const perPage = Math.min(Math.max(1, Number(request.input('perPage', 30)) || 30), 100)

    const rawAction = String(request.input('action', '') ?? '')
    const rawUserId = request.input('userId')
    const rawResource = String(request.input('resourceType', '') ?? '')

    const action = VALID_ACTIONS.has(rawAction) ? rawAction : null
    const resourceType = VALID_RESOURCE_TYPES.has(rawResource) ? rawResource : null
    const userId = rawUserId && /^\d+$/.test(String(rawUserId)) ? Number(rawUserId) : null
    const startDate = parseDate(request.input('startDate'))
    const endDate = parseDate(request.input('endDate'))

    const query = AuditLog.query()
      .where('restaurant_id', restaurant.id)
      .orderBy('created_at', 'desc')

    if (action) query.where('action', action)
    if (userId) query.where('user_id', userId)
    if (resourceType) query.where('resource_type', resourceType)
    if (startDate) query.where('created_at', '>=', `${startDate} 00:00:00`)
    if (endDate) query.where('created_at', '<=', `${endDate} 23:59:59`)

    const logs = await query.paginate(page, perPage)
    return response.ok(logs)
  }

  /** GET /api/super-admin/audit-logs — all restaurants, super admin only */
  async indexAll({ request, response }: HttpContext) {
    const page = Math.max(1, Number(request.input('page', 1)) || 1)
    const perPage = Math.min(Math.max(1, Number(request.input('perPage', 30)) || 30), 100)

    const rawAction = String(request.input('action', '') ?? '')
    const rawResource = String(request.input('resourceType', '') ?? '')
    const rawRestaurantId = request.input('restaurantId')

    const action = VALID_ACTIONS.has(rawAction) ? rawAction : null
    const resourceType = VALID_RESOURCE_TYPES.has(rawResource) ? rawResource : null
    const restaurantId =
      rawRestaurantId && /^\d+$/.test(String(rawRestaurantId)) ? Number(rawRestaurantId) : null
    const startDate = parseDate(request.input('startDate'))
    const endDate = parseDate(request.input('endDate'))

    const query = AuditLog.query()
      .preload('restaurant', (q) => q.select(['id', 'name', 'slug']))
      .orderBy('created_at', 'desc')

    if (action) query.where('action', action)
    if (resourceType) query.where('resource_type', resourceType)
    if (restaurantId) query.where('restaurant_id', restaurantId)
    if (startDate) query.where('created_at', '>=', `${startDate} 00:00:00`)
    if (endDate) query.where('created_at', '<=', `${endDate} 23:59:59`)

    const logs = await query.paginate(page, perPage)
    return response.ok(logs)
  }
}
