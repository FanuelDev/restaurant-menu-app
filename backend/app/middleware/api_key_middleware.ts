// backend/app/middleware/api_key_middleware.ts
// Authentifie les requêtes de l'API externe via la clé API.
// Supporte :
//   Authorization: Bearer saem_live_xxxxxxxx
//   X-Api-Key: saem_live_xxxxxxxx

import { createHash } from 'node:crypto'
import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import ApiKey from '#models/api_key'

function extractRawKey(ctx: HttpContext): string | null {
  const auth = ctx.request.header('authorization') ?? ''
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim() || null
  }
  return ctx.request.header('x-api-key') ?? null
}

function hashKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

export default class ApiKeyMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const raw = extractRawKey(ctx)
    if (!raw) {
      return ctx.response.unauthorized({ error: 'API key missing. Use Authorization: Bearer <key> or X-Api-Key header.' })
    }

    const hash = hashKey(raw)
    const apiKey = await ApiKey.query()
      .where('key_hash', hash)
      .where('is_active', true)
      .preload('restaurant', (q) => q.preload('plan'))
      .first()

    if (!apiKey) {
      return ctx.response.unauthorized({ error: 'Invalid or revoked API key.' })
    }

    if (apiKey.isExpired) {
      return ctx.response.unauthorized({ error: 'API key has expired.' })
    }

    if (!apiKey.restaurant.isActive) {
      return ctx.response.forbidden({ error: 'Restaurant account is suspended.' })
    }

    // Met à jour le timestamp last_used_at (sans bloquer la requête)
    apiKey.lastUsedAt = DateTime.now()
    apiKey.save().catch(() => {})

    // Injecte le restaurant dans le contexte (compatible tenant_middleware)
    ctx.restaurant = apiKey.restaurant

    return next()
  }
}
