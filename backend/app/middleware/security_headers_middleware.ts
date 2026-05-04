import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Adds defensive HTTP security headers to every response.
 * Register once as a server-level middleware in start/kernel.ts.
 */
export default class SecurityHeadersMiddleware {
  async handle({ response }: HttpContext, next: NextFn) {
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

    // Content Security Policy — API-only: block everything except same origin
    // Frontend assets are served separately; tighten as needed
    response.header(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'"
    )

    // Prevent IE/Edge from activating compatibility mode
    response.header('X-Compatible', 'IE=edge')

    return next()
  }
}
