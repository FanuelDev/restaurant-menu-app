import type { HttpContext } from '@adonisjs/core/http'
import AuditLog from '#models/audit_log'

const VALID_ACTIONS = new Set([
  'category.created', 'category.updated', 'category.deleted',
  'menu_item.created', 'menu_item.updated', 'menu_item.deleted', 'menu_item.toggled',
  'user.created', 'user.updated', 'user.deleted',
  'restaurant.updated', 'restaurant.logo_uploaded',
  'subscription.created', 'subscription.canceled',
])

const VALID_RESOURCE_TYPES = new Set([
  'category', 'menu_item', 'user', 'restaurant', 'subscription',
])

export default class AuditLogsController {
  /** GET /api/admin/audit-logs */
  async index({ request, response, restaurant }: HttpContext) {
    const page = Math.max(1, Number(request.input('page', 1)) || 1)
    const perPage = Math.min(Math.max(1, Number(request.input('perPage', 50)) || 50), 100)

    // Whitelist-only filtering — reject unknown values silently (treat as "no filter")
    const rawAction = String(request.input('action', '') ?? '')
    const rawUserId = request.input('userId')
    const rawResource = String(request.input('resourceType', '') ?? '')

    const action = VALID_ACTIONS.has(rawAction) ? rawAction : null
    const resourceType = VALID_RESOURCE_TYPES.has(rawResource) ? rawResource : null
    const userId = rawUserId && /^\d+$/.test(String(rawUserId)) ? Number(rawUserId) : null

    const query = AuditLog.query()
      .where('restaurant_id', restaurant.id)
      .orderBy('created_at', 'desc')

    if (action) query.where('action', action)
    if (userId) query.where('user_id', userId)
    if (resourceType) query.where('resource_type', resourceType)

    const logs = await query.paginate(page, perPage)

    return response.ok(logs)
  }
}
