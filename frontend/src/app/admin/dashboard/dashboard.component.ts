// frontend/src/app/admin/dashboard/dashboard.component.ts
import { Component, inject, OnInit, signal, computed } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { MenuService } from '../../shared/services/menu.service'
import { RestaurantService } from '../../shared/services/restaurant.service'
import { AuthService } from '../../shared/services/auth.service'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <header class="page-header">
        <div>
          <h1 class="page-title">Bonjour, {{ user()?.fullName || 'Admin' }} 👋</h1>
          <p class="page-subtitle">Voici un aperçu de votre menu</p>
        </div>
        <a routerLink="/" target="_blank" class="btn btn-outline">
          <span aria-hidden="true">👁️</span> Voir la vitrine
        </a>
      </header>

      <!-- Stats cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card__icon" aria-hidden="true">🗂️</div>
          <div class="stat-card__body">
            <div class="stat-card__value">{{ categories().length }}</div>
            <div class="stat-card__label">Catégories</div>
          </div>
          <a routerLink="/admin/categories" class="stat-card__link" aria-label="Gérer les catégories">→</a>
        </div>

        <div class="stat-card">
          <div class="stat-card__icon" aria-hidden="true">🍽️</div>
          <div class="stat-card__body">
            <div class="stat-card__value">{{ totalItems() }}</div>
            <div class="stat-card__label">Plats au total</div>
          </div>
          <a routerLink="/admin/menu-items" class="stat-card__link" aria-label="Gérer les plats">→</a>
        </div>

        <div class="stat-card stat-card--success">
          <div class="stat-card__icon" aria-hidden="true">✅</div>
          <div class="stat-card__body">
            <div class="stat-card__value">{{ availableItems() }}</div>
            <div class="stat-card__label">Disponibles</div>
          </div>
        </div>

        <div class="stat-card stat-card--warning">
          <div class="stat-card__icon" aria-hidden="true">⚠️</div>
          <div class="stat-card__body">
            <div class="stat-card__value">{{ unavailableItems() }}</div>
            <div class="stat-card__label">Indisponibles</div>
          </div>
        </div>
      </div>

      <!-- Restaurant info -->
      @if (restaurant()) {
        <div class="info-card">
          <h2 class="info-card__title">Informations restaurant</h2>
          <div class="restaurant-preview">
            @if (restaurant()!.logoUrl) {
              <img [src]="restaurant()!.logoUrl" [alt]="restaurant()!.name" class="restaurant-logo" />
            }
            <div class="restaurant-info">
              <h3 class="restaurant-name">{{ restaurant()!.name }}</h3>
              @if (restaurant()!.slogan) {
                <p class="restaurant-slogan">{{ restaurant()!.slogan }}</p>
              }
              <div class="brand-color-preview">
                <span
                  class="color-swatch"
                  [style.background]="restaurant()!.brandColor"
                  aria-hidden="true"
                ></span>
                <span>{{ restaurant()!.brandColor }}</span>
              </div>
            </div>
            <a routerLink="/admin/restaurant" class="btn btn-outline">Modifier</a>
          </div>
        </div>
      }

      <!-- Actions rapides -->
      <div class="quick-actions">
        <h2 class="quick-actions__title">Actions rapides</h2>
        <div class="quick-actions__grid">
          <a routerLink="/admin/categories" class="quick-action">
            <span class="quick-action__icon" aria-hidden="true">➕</span>
            <span>Ajouter une catégorie</span>
          </a>
          <a routerLink="/admin/menu-items" class="quick-action">
            <span class="quick-action__icon" aria-hidden="true">🍳</span>
            <span>Ajouter un plat</span>
          </a>
          <a routerLink="/admin/restaurant" class="quick-action">
            <span class="quick-action__icon" aria-hidden="true">🎨</span>
            <span>Modifier la charte</span>
          </a>
          <a routerLink="/" target="_blank" class="quick-action">
            <span class="quick-action__icon" aria-hidden="true">🌐</span>
            <span>Voir la page client</span>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { max-width: 1000px; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-8);
    }

    .page-title { font-family: var(--font-display); font-size: 2rem; color: var(--text-primary); margin: 0 0 var(--space-1); }
    .page-subtitle { color: var(--text-muted); margin: 0; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .stat-card {
      background: var(--surface-1);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      display: flex;
      align-items: center;
      gap: var(--space-4);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
      position: relative;

      &__icon { font-size: 2rem; }
      &__value { font-size: 2rem; font-weight: 700; color: var(--text-primary); line-height: 1; }
      &__label { font-size: 0.8125rem; color: var(--text-muted); margin-top: var(--space-1); }
      &__body { flex: 1; }
      &__link {
        position: absolute; top: var(--space-3); right: var(--space-3);
        text-decoration: none; color: var(--text-muted); font-size: 1.25rem;
        &:hover { color: var(--color-brand); }
      }

      &--success { border-left: 4px solid #22c55e; }
      &--warning { border-left: 4px solid #f59e0b; }
    }

    .info-card {
      background: var(--surface-1);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      border: 1px solid var(--border);
      margin-bottom: var(--space-6);

      &__title { font-size: 1.125rem; font-weight: 600; color: var(--text-primary); margin: 0 0 var(--space-4); }
    }

    .restaurant-preview {
      display: flex;
      align-items: center;
      gap: var(--space-5);
    }

    .restaurant-logo {
      width: 64px; height: 64px;
      border-radius: var(--radius-lg);
      object-fit: cover;
      border: 1px solid var(--border);
    }

    .restaurant-info { flex: 1; }
    .restaurant-name { font-size: 1.25rem; font-weight: 700; margin: 0 0 var(--space-1); }
    .restaurant-slogan { color: var(--text-muted); font-style: italic; margin: 0 0 var(--space-2); font-size: 0.9375rem; }

    .brand-color-preview {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .color-swatch {
      display: inline-block;
      width: 20px; height: 20px;
      border-radius: 50%;
      border: 1px solid var(--border);
    }

    .quick-actions {
      background: var(--surface-1);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      border: 1px solid var(--border);

      &__title { font-size: 1.125rem; font-weight: 600; margin: 0 0 var(--space-4); }
      &__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--space-3); }
    }

    .quick-action {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--surface-2);
      border-radius: var(--radius-md);
      text-decoration: none;
      color: var(--text-primary);
      font-weight: 500;
      font-size: 0.9375rem;
      transition: all 0.2s;
      border: 1px solid var(--border);

      &:hover { background: color-mix(in srgb, var(--color-brand) 8%, var(--surface-1)); border-color: var(--color-brand); color: var(--color-brand); }
      &__icon { font-size: 1.5rem; }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: 0.625rem 1.25rem;
      border-radius: var(--radius-md);
      font-weight: 500;
      font-size: 0.9375rem;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      border: 1px solid transparent;

      &-outline {
        border-color: var(--border);
        color: var(--text-secondary);
        background: var(--surface-1);
        &:hover { border-color: var(--color-brand); color: var(--color-brand); }
      }
    }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly menuService = inject(MenuService)
  private readonly restaurantService = inject(RestaurantService)
  private readonly authService = inject(AuthService)

  readonly user = this.authService.user
  readonly restaurant = this.restaurantService.restaurant
  readonly categories = this.menuService.categories
  readonly menuItems = this.menuService.menuItems

  readonly totalItems = computed(() => this.menuItems().length)
  readonly availableItems = computed(() => this.menuItems().filter((i) => i.isAvailable).length)
  readonly unavailableItems = computed(() => this.menuItems().filter((i) => !i.isAvailable).length)

  ngOnInit(): void {
    this.menuService.loadAdminCategories().subscribe()
    this.menuService.loadAdminItems().subscribe()
    this.restaurantService.loadAdmin().subscribe()
  }
}
