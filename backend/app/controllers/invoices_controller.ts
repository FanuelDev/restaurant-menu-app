import type { HttpContext } from '@adonisjs/core/http'
import SaInvoice from '#models/sa_invoice'

export default class InvoicesController {
  /** GET /api/admin/invoices */
  async index({ restaurant, response }: HttpContext) {
    const invoices = await SaInvoice.query()
      .where('restaurant_id', restaurant.id)
      .orderBy('created_at', 'desc')
    return response.ok(invoices)
  }

  /** GET /api/admin/invoices/:id */
  async show({ params, restaurant, response }: HttpContext) {
    const invoice = await SaInvoice.query()
      .where('id', params.id)
      .where('restaurant_id', restaurant.id)
      .firstOrFail()
    return response.ok(invoice)
  }
}
