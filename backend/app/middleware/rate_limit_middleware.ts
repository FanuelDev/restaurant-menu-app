import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

interface RateLimitEntry {
  count: number
  resetAt: number
}

/**
 * Simple in-memory rate limiter.
 * Key = `${ip}:${routeKey}`, window = windowMs ms, max = maxRequests hits.
 *
 * For multi-instance deployments replace the Map with a Redis-backed store.
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

    // Periodic cleanup to avoid memory leak in long-running servers
    setInterval(() => this.#cleanup(), Math.max(options.windowMs, 60_000))
  }

  async handle(ctx: HttpContext, next: NextFn) {
    const ip = ctx.request.ip()
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
    return next()
  }

  #cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.#store) {
      if (now > entry.resetAt) this.#store.delete(key)
    }
  }
}

// Pre-built instances for each sensitive route group
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
