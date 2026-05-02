// backend/start/kernel.ts
import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

/**
 * Middleware global exécuté sur chaque requête HTTP.
 * L'ordre est important : les middlewares sont exécutés de haut en bas.
 */
server.use([
  () => import('@adonisjs/core/bodyparser_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
])

/**
 * Middleware nommés — appelés explicitement sur des routes/groupes.
 */
router.use([
  () => import('@adonisjs/auth/initialize_auth_middleware'),
])

export const middleware = router.named({
  auth: () => import('#middleware/auth_middleware'),
})
