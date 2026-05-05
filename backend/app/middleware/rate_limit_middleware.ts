import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { IncomingMessage } from 'node:http'

interface RateLimitEntry {
  count: number
  resetAt: number
}

/**
 * Récupère l'IP sans passer par request.ip() qui exige trustProxy.
 * Lit d'abord X-Forwarded-For (reverse proxy), puis le socket TCP direct.
 */
function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim()
  }
  return req.socket?.remoteAddress ?? 'unknown'
}

/**
 * Simple in-memory rate limiter — sans dépendance externe.
 * Clé = `${ip}:${routeKey}`, fenêtre = windowMs ms, max = maxRequests hits.
 * Pour un déploiement multi-instances, remplacer le Map par un store Redis.
 */
export class RateLimiter {
  readonly #store = new Map<string, RateLimitEntry>()
  readonly #maxRequests: number
  readonly #windowMs: number
  readonly #routeKey: string

  constructor(options: { maxRequests: number; windowMs: number; routeKey: string }) {
    this.#maxRequests = options.maxRequests
    this.#windowMs = options.windowMs
    this.#routeKey = options.routeKey

    // Nettoyage périodique pour éviter les fuites mémoire
    const timer = setInterval(() => this.#cleanup(), Math.max(options.windowMs, 60_000))
    // Ne pas bloquer la fermeture du process Node.js
    if (timer.unref) timer.unref()
  }

  async handle(ctx: HttpContext, next: NextFn) {
    try {
      const ip = getClientIp(ctx.request.request)
      const key = `${ip}:${this.#routeKey}`
      const now = Date.now()

      let entry = this.#store.get(key)

      if (!entry || now > entry.resetAt) {
        entry = { count: 1, resetAt: now + this.#windowMs }
        this.#store.set(key, entry)
        return next()
      }

      entry.count++

      if (entry.count > this.#maxRequests) {
        const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000)
        ctx.response.header('Retry-After', String(retryAfterSec))
        ctx.response.header('X-RateLimit-Limit', String(this.#maxRequests))
        ctx.response.header('X-RateLimit-Remaining', '0')
        return ctx.response.tooManyRequests({
          message: 'Trop de tentatives. Veuillez réessayer dans quelques minutes.',
          retryAfterSeconds: retryAfterSec,
        })
      }

      ctx.response.header('X-RateLimit-Limit', String(this.#maxRequests))
      ctx.response.header('X-RateLimit-Remaining', String(this.#maxRequests - entry.count))
    } catch {
      // En cas d'erreur inattendue, on laisse passer la requête
    }

    return next()
  }

  #cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.#store) {
      if (now > entry.resetAt) this.#store.delete(key)
    }
  }
}

// ── Instances pré-configurées par groupe de routes ────────────────────────────

export const loginRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 15 * 60 * 1000, // 15 min
  routeKey: 'login',
})

export const forgotPasswordRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 heure
  routeKey: 'forgot-password',
})

export const registerRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 heure
  routeKey: 'register',
})
