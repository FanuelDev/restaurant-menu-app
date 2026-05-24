// backend/app/middleware/api_key_middleware.ts
// ─────────────────────────────────────────────────────────────────────────────
// Authentifie et sécurise toutes les requêtes de l'API externe (/ext/v1/).
//
// Pipeline (dans l'ordre) :
//   1. Extraction de la clé brute (Authorization: Bearer | X-Api-Key)
//   2. Hash SHA-256 → lookup en base
//   3. Vérifications : active, non-expirée, restaurant actif, plan Enterprise
//   4. Rate limiting par clé  (300 req/min, sliding window)
//   5. Injection headers sécurité + rate-limit
//   6. Mise à jour last_used_at (fire-and-forget)
//   7. Injection ctx.restaurant pour les controllers

import { createHash }    from 'node:crypto'
import { DateTime }      from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn }     from '@adonisjs/core/types/http'
import ApiKey              from '#models/api_key'

// ── Rate limiter in-memory par clé (300 req / 60 s) ──────────────────────────
// Pour un déploiement multi-instances, remplacer rlStore par Redis.

const RL_MAX    = 300
const RL_WINDOW = 60_000 // ms

const rlStore = new Map<number, { count: number; resetAt: number }>()

// Nettoyage toutes les 5 min — évite les fuites mémoire
const rlTimer = setInterval(() => {
  const now = Date.now()
  for (const [id, entry] of rlStore) {
    if (now > entry.resetAt) rlStore.delete(id)
  }
}, 5 * 60_000)
if (rlTimer.unref) rlTimer.unref()

function consumeRateLimit(keyId: number): {
  allowed:   boolean
  remaining: number
  resetSec:  number
} {
  const now  = Date.now()
  let entry  = rlStore.get(keyId)

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + RL_WINDOW }
    rlStore.set(keyId, entry)
    return { allowed: true, remaining: RL_MAX - 1, resetSec: Math.ceil(RL_WINDOW / 1000) }
  }

  entry.count++
  const resetSec  = Math.ceil((entry.resetAt - now) / 1000)
  const remaining = Math.max(0, RL_MAX - entry.count)
  return { allowed: entry.count <= RL_MAX, remaining, resetSec }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractRawKey(ctx: HttpContext): string | null {
  const auth = ctx.request.header('authorization') ?? ''
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim() || null
  }
  return ctx.request.header('x-api-key') ?? null
}

function sha256(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

// ── Middleware ────────────────────────────────────────────────────────────────

export default class ApiKeyMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { response } = ctx

    // ── 1. Extraction de la clé ───────────────────────────────────────────────
    const raw = extractRawKey(ctx)
    if (!raw) {
      return response.unauthorized({
        error: 'API key missing.',
        hint:  'Pass your key via "Authorization: Bearer <key>" or "X-Api-Key: <key>".',
      })
    }

    // ── 2. Lookup en base (hash seul stocké — jamais la clé en clair) ─────────
    const apiKey = await ApiKey.query()
      .where('key_hash', sha256(raw))
      .where('is_active', true)
      .preload('restaurant', (q) => q.preload('plan'))
      .first()

    if (!apiKey) {
      return response.unauthorized({ error: 'Invalid or revoked API key.' })
    }

    // ── 3a. Clé expirée ───────────────────────────────────────────────────────
    if (apiKey.isExpired) {
      return response.unauthorized({ error: 'API key has expired.' })
    }

    // ── 3b. Compte suspendu ───────────────────────────────────────────────────
    if (!apiKey.restaurant.isActive) {
      return response.forbidden({ error: 'Restaurant account is suspended.' })
    }

    // ── 3c. Plan Enterprise obligatoire ──────────────────────────────────────
    const planSlug = apiKey.restaurant.plan?.slug ?? 'none'
    if (planSlug !== 'enterprise') {
      return response.forbidden({
        error:       'API access requires an Enterprise plan.',
        currentPlan: planSlug,
        upgrade:     'https://saemenus.com/pricing',
      })
    }

    // ── 4. Rate limiting (par clé, 300 req/min) ───────────────────────────────
    const rl = consumeRateLimit(apiKey.id)

    response.header('X-RateLimit-Limit',     String(RL_MAX))
    response.header('X-RateLimit-Remaining', String(rl.remaining))
    response.header('X-RateLimit-Reset',     String(rl.resetSec))

    if (!rl.allowed) {
      response.header('Retry-After', String(rl.resetSec))
      return response.tooManyRequests({
        error:              'Rate limit exceeded. Max 300 requests per minute per API key.',
        retryAfterSeconds:  rl.resetSec,
      })
    }

    // ── 5. Headers de sécurité spécifiques à l'API externe ───────────────────
    response.header('Cache-Control', 'no-store')          // jamais mis en cache
    response.header('X-Api-Version', 'ext/v1')            // version de l'API
    response.header('X-Robots-Tag',  'noindex, nofollow') // non indexable

    // ── 6. Mise à jour last_used_at (fire-and-forget, ne bloque pas) ─────────
    apiKey.lastUsedAt = DateTime.now()
    apiKey.save().catch(() => {})

    // ── 7. Injection du restaurant dans le contexte (tenant) ─────────────────
    ctx.restaurant = apiKey.restaurant

    return next()
  }
}
