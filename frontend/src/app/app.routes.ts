// frontend/src/app/app.routes.ts
import { Routes } from '@angular/router'
import { authGuard } from './shared/guards/auth.guard'

export const routes: Routes = [
  // ─── Page publique ────────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./public/menu-page/menu-page.component').then((m) => m.MenuPageComponent),
    title: 'Notre Menu',
  },

  // ─── Auth ─────────────────────────────────────────────────────────────────
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./admin/login/login.component').then((m) => m.LoginComponent),
    title: 'Connexion Admin',
  },

  // ─── Espace admin (protégé) ───────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./admin/layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
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
    ],
  },

  // Redirection 404
  { path: '**', redirectTo: '' },
]
