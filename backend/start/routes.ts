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
const StatsController = () => import('#controllers/stats_controller')
const WebhooksController = () => import('#controllers/webhooks_controller')
const OrdersController = () => import('#controllers/orders_controller')
const ReservationsController = () => import('#controllers/reservations_controller')
const FinanceController = () => import('#controllers/finance_controller')
const MarketingController = () => import('#controllers/marketing_controller')

// Super admin
const SARestaurantsController = () => import('#controllers/super_admin/restaurants_controller')
const SAPlansController = () => import('#controllers/super_admin/plans_controller')
const SAStatsController = () => import('#controllers/super_admin/stats_controller')
const SaInvoicesController = () => import('#controllers/super_admin/sa_invoices_controller')
const SaRevenueController = () => import('#controllers/super_admin/revenue_controller')

// Admin invoices
const InvoicesController = () => import('#controllers/invoices_controller')

// API keys (admin management) + External API v1
const ApiKeysController    = () => import('#controllers/api_keys_controller')
const ExternalApiController = () => import('#controllers/external_api_controller')

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
router.post('/api/register/verify-email', [RegisterController, 'verifyEmail'])
  .use((ctx, next) => registerRateLimiter.handle(ctx, next))
router.post('/api/register/resend-verification', [RegisterController, 'resendVerification'])
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
    router.get('/features', [OrdersController, 'featureCheck'])
    router.post('/orders', [OrdersController, 'store']).use(middleware.enterpriseGuard())
    router.get('/orders/:orderNumber', [OrdersController, 'show'])
    router.get('/redeem/:token', [OrdersController, 'redeemInfo'])
    router.post('/redeem/:token', [OrdersController, 'redeem'])
    router.post('/reservations', [ReservationsController, 'store']).use(middleware.reservationsGuard())
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
    router.post('/restaurant/cover', [RestaurantController, 'uploadCover'])
      .use(middleware.role(['admin']))
    router.delete('/restaurant/cover', [RestaurantController, 'deleteCover'])
      .use(middleware.role(['admin']))

    // Subscription
    router.get('/subscription', [SubscriptionsController, 'show'])
    router.get('/usage', [SubscriptionsController, 'usage'])
    router.post('/subscription', [SubscriptionsController, 'subscribe'])
      .use(middleware.role(['admin']))
    router.delete('/subscription', [SubscriptionsController, 'cancel'])
      .use(middleware.role(['admin']))

    // Team (cashiers) — admin only
    router.get('/team', [TeamController, 'index'])
      .use(middleware.role(['admin']))
    router.post('/team', [TeamController, 'store'])
      .use([middleware.role(['admin']), middleware.subscriptionGuard()])
    router.put('/team/:id', [TeamController, 'update'])
      .use(middleware.role(['admin']))
    router.delete('/team/:id', [TeamController, 'destroy'])
      .use(middleware.role(['admin']))

    // Stats — admin only (plan Pro+)
    router.get('/stats', [StatsController, 'index'])
      .use(middleware.role(['admin']))

    // Audit logs — admin only
    router.get('/audit-logs', [AuditLogsController, 'index'])
      .use(middleware.role(['admin']))

    // Orders (Pro/Enterprise feature — garde les routes protégées côté backend)
    router.get('/orders', [OrdersController, 'adminIndex'])
      .use(middleware.enterpriseGuard())
    router.post('/orders', [OrdersController, 'adminStore'])
      .use(middleware.enterpriseGuard())
    router.get('/orders/scan/:token', [OrdersController, 'adminScanToken'])
      .use([middleware.role(['admin']), middleware.enterpriseGuard()])
    router.patch('/orders/:id/status', [OrdersController, 'adminUpdateStatus'])
      .use(middleware.enterpriseGuard())
    router.post('/orders/:id/revoke-gift', [OrdersController, 'adminRevokeGift'])
      .use([middleware.role(['admin']), middleware.enterpriseGuard()])

    // Reservations (Enterprise uniquement)
    router.get('/reservations', [ReservationsController, 'adminIndex'])
      .use(middleware.reservationsGuard())
    router.post('/reservations', [ReservationsController, 'adminStore'])
      .use(middleware.reservationsGuard())
    router.patch('/reservations/:id/status', [ReservationsController, 'adminUpdateStatus'])
      .use(middleware.reservationsGuard())

    // Finance — Enterprise only (admin + cashier)
    router.get('/finance/summary', [FinanceController, 'summary'])
      .use(middleware.financeGuard())
    router.get('/finance/chart', [FinanceController, 'chart'])
      .use(middleware.financeGuard())
    router.get('/finance/expenses', [FinanceController, 'listExpenses'])
      .use(middleware.financeGuard())
    router.post('/finance/expenses', [FinanceController, 'createExpense'])
      .use(middleware.financeGuard())
    router.put('/finance/expenses/:id', [FinanceController, 'updateExpense'])
      .use(middleware.financeGuard())
    router.delete('/finance/expenses/:id', [FinanceController, 'deleteExpense'])
      .use(middleware.financeGuard())
    router.get('/finance/incomes', [FinanceController, 'listIncomes'])
      .use(middleware.financeGuard())
    router.post('/finance/incomes', [FinanceController, 'createIncome'])
      .use(middleware.financeGuard())
    router.put('/finance/incomes/:id', [FinanceController, 'updateIncome'])
      .use(middleware.financeGuard())
    router.delete('/finance/incomes/:id', [FinanceController, 'deleteIncome'])
      .use(middleware.financeGuard())
    router.get('/finance/order-revenues', [FinanceController, 'listOrderRevenues'])
      .use(middleware.financeGuard())

    // Marketing Vouchers — Enterprise only
    router.get('/marketing/vouchers', [MarketingController, 'index']).use(middleware.marketingGuard())
    router.post('/marketing/vouchers', [MarketingController, 'store']).use(middleware.marketingGuard())
    router.get('/marketing/vouchers/scan/:token', [MarketingController, 'scan']).use(middleware.marketingGuard())
    router.get('/marketing/stats', [MarketingController, 'stats']).use(middleware.marketingGuard())
    router.get('/marketing/vouchers/:id', [MarketingController, 'show']).use(middleware.marketingGuard())
    router.patch('/marketing/vouchers/:id', [MarketingController, 'update']).use(middleware.marketingGuard())
    router.delete('/marketing/vouchers/:id', [MarketingController, 'destroy']).use(middleware.marketingGuard())
    router.post('/marketing/vouchers/:id/redeem', [MarketingController, 'redeem']).use(middleware.marketingGuard())

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

    // Invoices — admin only
    router.get('/invoices', [InvoicesController, 'index'])
      .use(middleware.role(['admin']))
    router.get('/invoices/:id', [InvoicesController, 'show'])
      .use(middleware.role(['admin']))

    // API keys — Enterprise only
    router.get('/api-keys',     [ApiKeysController, 'index'])
      .use([middleware.role(['admin']), middleware.financeGuard()])
    router.post('/api-keys',    [ApiKeysController, 'store'])
      .use([middleware.role(['admin']), middleware.financeGuard()])
    router.delete('/api-keys/:id', [ApiKeysController, 'destroy'])
      .use([middleware.role(['admin']), middleware.financeGuard()])
  })
  .prefix('/api/admin')
  .use([middleware.tenant(), middleware.auth()])

// ─── External REST API v1 ─────────────────────────────────────────────────────
// Préfixe /ext/v1 — complètement isolé du namespace interne /api/
// Sécurité : ApiKeyMiddleware (auth + plan Enterprise + rate limit 300 req/min)
router
  .group(() => {
    router.get('/restaurant',            [ExternalApiController, 'getRestaurant'])
    router.get('/menu',                  [ExternalApiController, 'getMenu'])
    router.get('/menu/items',            [ExternalApiController, 'getMenuItems'])
    router.get('/orders',                [ExternalApiController, 'getOrders'])
    router.get('/orders/:orderNumber',   [ExternalApiController, 'getOrder'])
    router.post('/orders',               [ExternalApiController, 'createOrder'])
    router.get('/reservations',          [ExternalApiController, 'getReservations'])
    router.post('/reservations',         [ExternalApiController, 'createReservation'])
  })
  .prefix('/ext/v1')
  .use(middleware.apiKey())

// ─── Super admin routes (no tenant, auth + role check) ───────────────────────
router
  .group(() => {
    router.get('/stats', [SAStatsController, 'index'])
    router.get('/audit-logs', [AuditLogsController, 'indexAll'])
    router.get('/restaurants', [SARestaurantsController, 'index'])
    router.get('/restaurants/:id', [SARestaurantsController, 'show'])
    router.post('/restaurants/:id/block', [SARestaurantsController, 'block'])
    router.post('/restaurants/:id/unblock', [SARestaurantsController, 'unblock'])
    router.post('/restaurants/:id/assign-plan', [SARestaurantsController, 'assignPlan'])
    router.post('/restaurants/:id/verify-user', [SARestaurantsController, 'verifyUser'])
    router.get('/plans', [SAPlansController, 'index'])
    router.post('/plans', [SAPlansController, 'store'])
    router.put('/plans/:id', [SAPlansController, 'update'])
    router.delete('/plans/:id', [SAPlansController, 'destroy'])
    router.get('/invoices', [SaInvoicesController, 'index'])
    router.get('/invoices/:id', [SaInvoicesController, 'show'])
    router.get('/revenue', [SaRevenueController, 'index'])
  })
  .prefix('/api/super-admin')
  .use([middleware.auth(), middleware.role(['super_admin'])])
