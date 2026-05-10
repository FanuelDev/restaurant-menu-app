import type { HttpContext } from '@adonisjs/core/http'
import Reservation from '#models/reservation'
import {
  createReservationValidator,
  updateReservationStatusValidator,
} from '#validators/reservation_validator'
import AuditService from '#services/audit_service'

export default class ReservationsController {
  /** POST /api/public/reservations */
  async store({ request, response, restaurant }: HttpContext) {
    const data = await request.validateUsing(createReservationValidator)

    // Ensure the reserved date is in the future
    const today = new Date().toISOString().slice(0, 10)
    if (data.reservedDate < today) {
      return response.unprocessableEntity({ error: 'Reserved date must be in the future' })
    }

    const reservation = await Reservation.create({
      restaurantId: restaurant.id,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail ?? null,
      reservedDate: data.reservedDate,
      reservedTime: data.reservedTime,
      guestsCount: data.guestsCount,
      specialRequests: data.specialRequests ?? null,
      status: 'pending',
    })

    return response.created(reservation.serialize())
  }

  /** GET /api/admin/reservations */
  async adminIndex({ request, response, restaurant }: HttpContext) {
    const page = Number(request.input('page', 1))
    const perPage = Number(request.input('perPage', 20))
    const status = request.input('status')
    const date = request.input('date')

    let query = Reservation.query()
      .where('restaurant_id', restaurant.id)
      .orderBy('reserved_date', 'asc')
      .orderBy('reserved_time', 'asc')

    if (status) {
      query = query.where('status', status)
    }

    if (date) {
      query = query.where('reserved_date', date)
    }

    const reservations = await query.paginate(page, perPage)
    return response.ok(reservations.serialize())
  }

  /** PATCH /api/admin/reservations/:id/status */
  async adminUpdateStatus({ params, request, response, restaurant, auth }: HttpContext) {
    const reservation = await Reservation.query()
      .where('id', params.id)
      .where('restaurant_id', restaurant.id)
      .firstOrFail()

    const data = await request.validateUsing(updateReservationStatusValidator)
    const oldStatus = reservation.status
    reservation.status = data.status

    if (data.notes !== undefined) {
      reservation.notes = data.notes ?? null
    }

    await reservation.save()

    await new AuditService().log({
      ctx: { request },
      user: auth.user!,
      restaurantId: restaurant.id,
      action: 'reservation.status_updated',
      resourceType: 'reservation',
      resourceId: reservation.id,
      resourceName: reservation.customerName,
      oldValues: { status: oldStatus },
      newValues: { status: data.status },
    })

    return response.ok(reservation.serialize())
  }
}
