import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Adds defensive HTTP security headers to every response.
 * Register once as a server-level middleware in start/kernel.ts.
 */
export default class SecurityHeadersMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { response } = ctx
    // Prevent MIME-type sniffing
    response.header('X-Content-Type-Options', 'nosniff')

    // Disallow embedding in iframes (clickjacking)
    response.header('X-Frame-Options', 'DENY')

    // Limit referrer information sent to third parties
    response.header('Referrer-Policy', 'strict-origin-when-cross-origin')

    // Disable browser features not needed by this API
    response.header(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=()'
    )

    // Enforce HTTPS for 1 year in production (include subdomains for SaaS tenants)
    if (process.env.NODE_ENV === 'production') {
      response.header(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      )
    }

    // Anti-clickjacking — interdit l'embedding dans un iframe
    // frame-ancestors remplace X-Frame-Options dans les navigateurs modernes
    // Exception : la page /api/docs charge Swagger UI depuis unpkg.com
    const path = ctx.request.url()
    if (!path.startsWith('/api/docs') && !path.startsWith('/openapi')) {
      response.header('Content-Security-Policy', "frame-ancestors 'none'")
    }

    // Prevent IE/Edge from activating compatibility mode
    response.header('X-Compatible', 'IE=edge')

    return next()
  }
}
