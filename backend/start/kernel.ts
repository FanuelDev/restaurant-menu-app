import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

server.use([
  () => import('@adonisjs/core/bodyparser_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
  () => import('#middleware/security_headers_middleware'),
])

router.use([
  () => import('@adonisjs/auth/initialize_auth_middleware'),
])

export const middleware = router.named({
  auth: () => import('#middleware/auth_middleware'),
  tenant: () => import('#middleware/tenant_middleware'),
  role: () => import('#middleware/role_middleware'),
  subscriptionGuard: () => import('#middleware/subscription_guard_middleware'),
  enterpriseGuard: () => import('#middleware/enterprise_guard_middleware'),
})
