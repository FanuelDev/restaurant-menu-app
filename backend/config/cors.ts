// backend/config/cors.ts
import env from '#start/env'
import { defineConfig } from '@adonisjs/cors'

/**
 * CORS — autorise les requêtes cross-origin depuis le frontend Angular.
 * En production, remplacer par l'URL exacte du frontend.
 */
const corsConfig = defineConfig({
  enabled: true,

  // Origines autorisées : localhost:4200 + tous ses sous-domaines (*.localhost:4200)
  origin: (origin) => {
    if (!origin) return false
    const allowed = (env.get('CORS_ORIGIN', 'http://localhost:4200') as string)
      .split(',')
      .map((o) => o.trim())
    // Correspondance exacte ou sous-domaine de localhost:4200
    return allowed.some((base) => {
      if (origin === base) return true
      // ex. http://demo.localhost:4200 → autorisé si base = http://localhost:4200
      try {
        const baseUrl = new URL(base)
        const originUrl = new URL(origin)
        return originUrl.port === baseUrl.port && originUrl.hostname.endsWith(`.${baseUrl.hostname}`)
      } catch { return false }
    })
  },

  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
