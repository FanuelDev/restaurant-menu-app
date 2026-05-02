// backend/start/routes.ts
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// ─── Imports lazys des controllers (optimisation du démarrage) ───────────────
const AuthController = () => import('#controllers/auth_controller')
const RestaurantController = () => import('#controllers/restaurant_controller')
const CategoriesController = () => import('#controllers/categories_controller')
const MenuItemsController = () => import('#controllers/menu_items_controller')

// ─── Health check ────────────────────────────────────────────────────────────
router.get('/health', async ({ response }) => {
  return response.ok({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── Authentification ─────────────────────────────────────────────────────────
router.post('/api/auth/login', [AuthController, 'login'])
router.delete('/api/auth/logout', [AuthController, 'logout']).use(middleware.auth())
router.get('/api/auth/me', [AuthController, 'me']).use(middleware.auth())

// ─── Données publiques (sans auth) ───────────────────────────────────────────
router.get('/api/public/restaurant', [RestaurantController, 'showPublic'])
router.get('/api/public/categories', [CategoriesController, 'indexPublic'])
router.get('/api/public/menu-items', [MenuItemsController, 'indexPublic'])

// ─── Routes admin (protégées par JWT) ────────────────────────────────────────
router
  .group(() => {
    // Restaurant
    router.get('/restaurant', [RestaurantController, 'show'])
    router.put('/restaurant', [RestaurantController, 'update'])
    router.post('/restaurant/logo', [RestaurantController, 'uploadLogo'])

    // Catégories
    router.get('/categories', [CategoriesController, 'index'])
    router.post('/categories', [CategoriesController, 'store'])
    router.put('/categories/:id', [CategoriesController, 'update'])
    router.delete('/categories/:id', [CategoriesController, 'destroy'])
    router.patch('/categories/reorder', [CategoriesController, 'reorder'])

    // Plats du menu
    router.get('/menu-items', [MenuItemsController, 'index'])
    router.post('/menu-items', [MenuItemsController, 'store'])
    router.get('/menu-items/:id', [MenuItemsController, 'show'])
    router.put('/menu-items/:id', [MenuItemsController, 'update'])
    router.delete('/menu-items/:id', [MenuItemsController, 'destroy'])
    router.patch('/menu-items/:id/toggle-availability', [MenuItemsController, 'toggleAvailability'])
  })
  .prefix('/api/admin')
  .use(middleware.auth())
