import type { HttpContext } from '@adonisjs/core/http'
import { createHash } from 'node:crypto'
import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'

const trackValidator = vine.compile(
  vine.object({
    sessionId: vine.string().maxLength(64),
    path: vine.string().maxLength(500),
    referrer: vine.string().maxLength(500).nullable().optional(),
    restaurantSlug: vine.string().maxLength(100).nullable().optional(),
  })
)

export default class TrackingController {
  /** POST /api/track — public, no auth */
  async store({ request, response }: HttpContext) {
    const body = await request.validateUsing(trackValidator)

    const ip = request.ip()
    const ua = request.header('user-agent') ?? ''
    const visitorId = createHash('sha256').update(ip + ua).digest('hex').slice(0, 64)

    await db.table('site_visits').insert({
      visitor_id: visitorId,
      session_id: body.sessionId,
      path: body.path,
      referrer: body.referrer ?? null,
      restaurant_slug: body.restaurantSlug ?? null,
    })

    return response.noContent()
  }
}
