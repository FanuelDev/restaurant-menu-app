import { Routes } from '@angular/router'
import { authGuard, superAdminGuard, adminGuard } from './shared/guards/auth.guard'

export const routes: Routes = [
  // ─── Public pages ────────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./public/landing/landing.component').then((m) => m.LandingComponent),
    title: 'MenuApp — Menu digital QR pour restaurants',
  },
  {
    path: 'menu',
    loadComponent: () =>
      import('./public/menu-page/menu-page.component').then((m) => m.MenuPageComponent),
    title: 'Notre Menu',
  },
  {
    path: 'pricing',
    loadComponent: () =>
      import('./public/pricing/pricing.component').then((m) => m.PricingComponent),
    title: 'Tarifs',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./public/register/register.component').then((m) => m.RegisterComponent),
    title: 'Inscription',
  },

  // ─── Auth ─────────────────────────────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () =>
      import('./admin/login/login.component').then((m) => m.LoginComponent),
    title: 'Connexion',
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./admin/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
    title: 'Mot de passe oublié',
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./admin/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
    title: 'Réinitialiser le mot de passe',
  },
  // Legacy redirect
  { path: 'admin/login', redirectTo: 'login', pathMatch: 'full' },

  // ─── Tenant admin (admin + cashier) ──────────────────────────────────────
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin/layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./admin/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Tableau de bord',
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./admin/categories/categories.component').then((m) => m.CategoriesComponent),
        title: 'Catégories',
      },
      {
        path: 'menu-items',
        loadComponent: () =>
          import('./admin/menu-items/menu-items.component').then((m) => m.MenuItemsComponent),
        title: 'Plats du menu',
      },
      {
        path: 'restaurant',
        loadComponent: () =>
          import('./admin/restaurant/restaurant.component').then((m) => m.RestaurantComponent),
        title: 'Infos restaurant',
      },
      {
        path: 'subscription',
        loadComponent: () =>
          import('./admin/subscription/subscription.component').then((m) => m.SubscriptionComponent),
        title: 'Abonnement',
      },
      {
        path: 'team',
        loadComponent: () =>
          import('./admin/team/team.component').then((m) => m.TeamComponent),
        title: 'Équipe',
      },
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./admin/audit-logs/audit-logs.component').then((m) => m.AuditLogsComponent),
        title: 'Journal d\'audit',
      },
      {
        path: 'stats',
        loadComponent: () =>
          import('./admin/stats/stats.component').then((m) => m.StatsComponent),
        title: 'Statistiques',
      },
      {
        path: 'api',
        loadComponent: () =>
          import('./admin/api/api.component').then((m) => m.ApiComponent),
        title: 'API dédiée',
      },
    ],
  },

  // ─── Super admin ──────────────────────────────────────────────────────────
  {
    path: 'super-admin',
    canActivate: [superAdminGuard],
    loadComponent: () =>
      import('./super-admin/layout/super-admin-layout.component').then((m) => m.SuperAdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./super-admin/dashboard/sa-dashboard.component').then((m) => m.SaDashboardComponent),
        title: 'Super Admin — Dashboard',
      },
      {
        path: 'restaurants',
        loadComponent: () =>
          import('./super-admin/restaurants/sa-restaurants.component').then((m) => m.SaRestaurantsComponent),
        title: 'Super Admin — Restaurants',
      },
      {
        path: 'restaurants/:id',
        loadComponent: () =>
          import('./super-admin/restaurants/sa-restaurant-detail.component').then((m) => m.SaRestaurantDetailComponent),
        title: 'Super Admin — Détail restaurant',
      },
      {
        path: 'plans',
        loadComponent: () =>
          import('./super-admin/plans/sa-plans.component').then((m) => m.SaPlansComponent),
        title: 'Super Admin — Plans',
      },
    ],
  },

  // ─── 404 ─────────────────────────────────────────────────────────────────
  { path: '**', redirectTo: '' },
]
