import type { HttpContext } from '@adonisjs/core/http'
import AuditLog from '#models/audit_log'

export default class AuditLogsController {
  /** GET /api/admin/audit-logs */
  async index({ request, response, restaurant }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = Math.min(request.input('perPage', 50), 100)
    const action = request.input('action')
    const userId = request.input('userId')
    const resourceType = request.input('resourceType')

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
