import type { HttpContext } from '@adonisjs/core/http'
import SaInvoice from '#models/sa_invoice'

export default class SaInvoicesController {
  /** GET /api/super-admin/invoices */
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const restaurantId = request.input('restaurantId')

    const query = SaInvoice.query()
      .preload('restaurant')
      .preload('granter')
      .orderBy('created_at', 'desc')

    if (restaurantId) query.where('restaurant_id', restaurantId)

    const invoices = await query.paginate(page, limit)
    return response.ok(invoices)
  }

  /** GET /api/super-admin/invoices/:id */
  async show({ params, response }: HttpContext) {
    const invoice = await SaInvoice.query()
      .where('id', params.id)
      .preload('restaurant')
      .preload('granter')
      .firstOrFail()

    return response.ok(invoice)
  }
}
