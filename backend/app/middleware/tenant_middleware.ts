import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import Restaurant from '#models/restaurant'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    restaurant: Restaurant
  }
}

/**
 * Résout le tenant (restaurant) depuis :
 * 1. Le sous-domaine : bistrot.monapp.com → slug = "bistrot"
 * 2. En développement : header X-Tenant-Slug (pour tester sans DNS)
 */
export default class TenantMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx

    // X-Tenant-Slug a la priorité (dev + appels API directs via backend.*)
    // Le sous-domaine sert de fallback pour les vitrines publiques (bistrot.saemenus.com)
    const slug = request.header('x-tenant-slug')
      ?? this.#extractSlug(request.host() ?? '')

    if (!slug) {
      return response.unprocessableEntity({ message: 'Tenant non identifiable — sous-domaine manquant.' })
    }

    const restaurant = await Restaurant.query()
      .where('slug', slug)
      .preload('plan')
      .first()

    if (!restaurant) {
      return response.notFound({ message: `Restaurant "${slug}" introuvable.` })
    }

    if (!restaurant.isActive) {
      return response.forbidden({
        message: 'Ce compte restaurant a été suspendu. Contactez le support.',
        blockedReason: restaurant.blockedReason,
      })
    }

    ctx.restaurant = restaurant
    return next()
  }

  #extractSlug(host: string): string | null {
    // host: "bistrot.localhost" ou "bistrot.monapp.com"
    const parts = host.split('.')
    // Ignorer "www", "api", "admin", "app" et les hôtes sans sous-domaine
    const reserved = new Set(['www', 'api', 'admin', 'app', 'backend', 'localhost', ''])
    if (parts.length < 2) return null
    const sub = parts[0]
    return reserved.has(sub) ? null : sub
  }
}
