// backend/config/cors.ts
import env from '#start/env'
import { defineConfig } from '@adonisjs/cors'

/**
 * CORS — autorise les requêtes cross-origin depuis le frontend Angular.
 * En production, remplacer par l'URL exacte du frontend.
 */
const corsConfig = defineConfig({
  enabled: true,

  // Origines autorisées (depuis CORS_ORIGIN en .env)
  origin: (origin) => {
    const allowed = (env.get('CORS_ORIGIN', 'http://localhost:4200') as string)
      .split(',')
      .map((o) => o.trim())
    return allowed.includes(origin)
  },

  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
