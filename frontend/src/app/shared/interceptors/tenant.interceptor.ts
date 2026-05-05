import { HttpInterceptorFn } from '@angular/common/http'
import { environment } from '../../../environments/environment'

/** Extracts the tenant slug from the current subdomain.
 *  demo.localhost:4200  → 'demo'
 *  localhost:4200       → null (no tenant)
 */
function getSlugFromHost(): string | null {
  const hostname = window.location.hostname // e.g. "demo.localhost"
  const parts = hostname.split('.')
  const reserved = new Set(['www', 'app', 'api', 'admin', 'localhost', ''])
  if (parts.length < 2) return null
  const sub = parts[0]
  return reserved.has(sub) ? null : sub
}

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  // Only add the header for public API calls (no auth token involved)
  const isPublicApi = req.url.includes('/api/public/')
  if (!isPublicApi) return next(req)

  const slug = getSlugFromHost()
  if (!slug) return next(req)

  return next(req.clone({ setHeaders: { 'X-Tenant-Slug': slug } }))
}
