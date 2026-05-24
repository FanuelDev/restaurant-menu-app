// backend/app/controllers/api_keys_controller.ts
// CRUD sur les clés API depuis le tableau de bord admin restaurant.
// Les clés sont réservées au plan Enterprise.

import { createHash, randomBytes } from 'node:crypto'
import vine from '@vinejs/vine'
import type { HttpContext } from '@adonisjs/core/http'
import ApiKey from '#models/api_key'

const createValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100),
  })
)

/** Préfixe lisible : "saem_live_" + 8 premiers hex de l'aléa + "…"
 *  Total : 10 + 8 + 1 = 19 chars — tient dans varchar(20)
 */
function makeKey(): { raw: string; prefix: string; hash: string } {
  const secret = randomBytes(32).toString('hex')      // 64 hex chars
  const raw    = `saem_live_${secret}`
  const prefix = `saem_live_${secret.slice(0, 8)}…`  // affiché dans l'UI
  const hash   = createHash('sha256').update(raw).digest('hex')
  return { raw, prefix, hash }
}

export default class ApiKeysController {
  /** GET /api/admin/api-keys */
  async index({ auth, response }: HttpContext) {
    const user = auth.user!
    const keys = await ApiKey.query()
      .where('restaurant_id', user.restaurantId!)
      .orderBy('created_at', 'desc')

    return response.ok(
      keys.map((k) => ({
        id:         k.id,
        name:       k.name,
        keyPrefix:  k.keyPrefix,
        isActive:   k.isActive,
        lastUsedAt: k.lastUsedAt?.toISO() ?? null,
        expiresAt:  k.expiresAt?.toISO()  ?? null,
        createdAt:  k.createdAt.toISO(),
      }))
    )
  }

  /** POST /api/admin/api-keys */
  async store({ auth, request, response }: HttpContext) {
    const { name } = await request.validateUsing(createValidator)
    const user = auth.user!

    // Limite : 10 clés actives par restaurant
    const count = await ApiKey.query()
      .where('restaurant_id', user.restaurantId!)
      .where('is_active', true)
      .count('* as total')
    if (Number((count[0] as any).$extras.total) >= 10) {
      return response.unprocessableEntity({ message: 'Maximum 10 active API keys allowed.' })
    }

    const { raw, prefix, hash } = makeKey()

    const apiKey = await ApiKey.create({
      restaurantId: user.restaurantId!,
      name,
      keyPrefix: prefix,
      keyHash:   hash,
      isActive:  true,
    })

    // La clé complète (raw) n'est renvoyée qu'ici — elle ne sera jamais stockée en clair
    return response.created({
      id:        apiKey.id,
      name:      apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      key:       raw,   // ⚠ unique occasion de la voir — à copier immédiatement
      createdAt: apiKey.createdAt.toISO(),
    })
  }

  /** DELETE /api/admin/api-keys/:id */
  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const apiKey = await ApiKey.query()
      .where('id', params.id)
      .where('restaurant_id', user.restaurantId!)
      .firstOrFail()

    apiKey.isActive = false
    await apiKey.save()

    return response.ok({ message: 'API key revoked.' })
  }
}
