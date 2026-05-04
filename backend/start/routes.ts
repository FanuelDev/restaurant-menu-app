import router from '@adonisjs/core/services/router'
import app from '@adonisjs/core/services/app'
import { middleware } from '#start/kernel'
import {
  loginRateLimiter,
  forgotPasswordRateLimiter,
  registerRateLimiter,
} from '#middleware/rate_limit_middleware'

// ─── Lazy imports ─────────────────────────────────────────────────────────────
const AuthController = () => import('#controllers/auth_controller')
const RegisterController = () => import('#controllers/register_controller')
const RestaurantController = () => import('#controllers/restaurant_controller')
const CategoriesController = () => import('#controllers/categories_controller')
const MenuItemsController = () => import('#controllers/menu_items_controller')
const SubscriptionsController = () => import('#controllers/subscriptions_controller')
const TeamController = () => import('#controllers/team_controller')
const AuditLogsController = () => import('#controllers/audit_logs_controller')
const WebhooksController = () => import('#controllers/webhooks_controller')

// Super admin
const SARestaurantsController = () => import('#controllers/super_admin/restaurants_controller')
const SAPlansController = () => import('#controllers/super_admin/plans_controller')
const SAStatsController = () => import('#controllers/super_admin/stats_controller')

// ─── Static / health ──────────────────────────────────────────────────────────
router.get('/health', async ({ response }) => response.ok({ status: 'ok', timestamp: new Date().toISOString() }))
router.get('/openapi.json', async ({ response }) => response.download(app.publicPath('openapi.json')))

router.get('/api/docs', async ({ response }) => {
  return response.header('Content-Type', 'text/html').send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Restaurant Menu API — Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>body{margin:0}.swagger-ui .topbar{background:#1a1a2e}.swagger-ui .topbar .download-url-wrapper{display:none}</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({ url:'/openapi.json', dom_id:'#swagger-ui',
      presets:[SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout:'BaseLayout', deepLinking:true, displayRequestDuration:true,
      filter:true, tryItOutEnabled:true, persistAuthorization:true })
  </script>
</body>
</html>`)
})

// ─── CinetPay webhook (no auth, no tenant) ────────────────────────────────────
router.post('/webhooks/cinetpay', [WebhooksController, 'cinetpay'])

// ─── Auth (no tenant required) ────────────────────────────────────────────────
router.post('/api/auth/login', [AuthController, 'login'])
  .use((ctx, next) => loginRateLimiter.handle(ctx, next))
router.post('/api/auth/forgot-password', [AuthController, 'forgotPassword'])
  .use((ctx, next) => forgotPasswordRateLimiter.handle(ctx, next))
router.post('/api/auth/reset-password', [AuthController, 'resetPassword'])
  .use((ctx, next) => loginRateLimiter.handle(ctx, next))
router.delete('/api/auth/logout', [AuthController, 'logout']).use(middleware.auth())
router.get('/api/auth/me', [AuthController, 'me']).use(middleware.auth())

// ─── Self-service registration ────────────────────────────────────────────────
router.post('/api/register', [RegisterController, 'store'])
  .use((ctx, next) => registerRateLimiter.handle(ctx, next))
router.get('/api/register/check-slug', [RegisterController, 'checkSlug'])

// ─── Public plans pricing page (no tenant, no auth) ──────────────────────────
router.get('/api/public/plans', [SubscriptionsController, 'publicPlans'])

// ─── Public tenant routes (tenant required, no auth) ─────────────────────────
router
  .group(() => {
    router.get('/restaurant', [RestaurantController, 'showPublic'])
    router.get('/categories', [CategoriesController, 'indexPublic'])
    router.get('/menu-items', [MenuItemsController, 'indexPublic'])
  })
  .prefix('/api/public')
  .use(middleware.tenant())

// ─── Admin routes (tenant + auth + subscription guard) ────────────────────────
router
  .group(() => {
    // Restaurant info
    router.get('/restaurant', [RestaurantController, 'show'])
    router.put('/restaurant', [RestaurantController, 'update'])
      .use(middleware.role(['admin']))
    router.post('/restaurant/logo', [RestaurantController, 'uploadLogo'])
      .use(middleware.role(['admin']))

    // Subscription
    router.get('/subscription', [SubscriptionsController, 'show'])
    router.post('/subscription', [SubscriptionsController, 'subscribe'])
      .use(middleware.role(['admin']))
    router.delete('/subscription', [SubscriptionsController, 'cancel'])
      .use(middleware.role(['admin']))

    // Team (cashiers) — admin only
    router.get('/team', [TeamController, 'index'])
      .use(middleware.role(['admin']))
    router.post('/team', [TeamController, 'store'])
      .use(middleware.role(['admin']))
    router.put('/team/:id', [TeamController, 'update'])
      .use(middleware.role(['admin']))
    router.delete('/team/:id', [TeamController, 'destroy'])
      .use(middleware.role(['admin']))

    // Audit logs — admin only
    router.get('/audit-logs', [AuditLogsController, 'index'])
      .use(middleware.role(['admin']))

    // Categories — admin + cashier can read/create/update; only admin can delete
    router.get('/categories', [CategoriesController, 'index'])
    router.post('/categories', [CategoriesController, 'store'])
      .use(middleware.subscriptionGuard())
    router.put('/categories/:id', [CategoriesController, 'update'])
      .use(middleware.subscriptionGuard())
    router.delete('/categories/:id', [CategoriesController, 'destroy'])
      .use(middleware.role(['admin']))
    router.patch('/categories/reorder', [CategoriesController, 'reorder'])

    // Menu items
    router.get('/menu-items', [MenuItemsController, 'index'])
    router.get('/menu-items/:id', [MenuItemsController, 'show'])
    router.post('/menu-items', [MenuItemsController, 'store'])
      .use(middleware.subscriptionGuard())
    router.put('/menu-items/:id', [MenuItemsController, 'update'])
      .use(middleware.subscriptionGuard())
    router.delete('/menu-items/:id', [MenuItemsController, 'destroy'])
      .use(middleware.role(['admin']))
    router.patch('/menu-items/:id/toggle-availability', [MenuItemsController, 'toggleAvailability'])
  })
  .prefix('/api/admin')
  .use([middleware.tenant(), middleware.auth()])

// ─── Super admin routes (no tenant, auth + role check) ───────────────────────
router
  .group(() => {
    router.get('/stats', [SAStatsController, 'index'])
    router.get('/restaurants', [SARestaurantsController, 'index'])
    router.get('/restaurants/:id', [SARestaurantsController, 'show'])
    router.post('/restaurants/:id/block', [SARestaurantsController, 'block'])
    router.post('/restaurants/:id/unblock', [SARestaurantsController, 'unblock'])
    router.get('/plans', [SAPlansController, 'index'])
    router.post('/plans', [SAPlansController, 'store'])
    router.put('/plans/:id', [SAPlansController, 'update'])
    router.delete('/plans/:id', [SAPlansController, 'destroy'])
  })
  .prefix('/api/super-admin')
  .use([middleware.auth(), middleware.role(['super_admin'])])
