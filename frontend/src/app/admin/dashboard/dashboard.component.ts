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

      <!-- Header -->
      <header class="page-header">
        <div>
          <h1 class="page-title">Bonjour, {{ firstName() }}</h1>
          <p class="page-subtitle">Voici un aperçu de votre menu aujourd'hui</p>
        </div>
        <a routerLink="/menu" target="_blank" class="btn btn-outline">
          <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.7">
            <path d="M1 9s3.5-7 8-7 8 7 8 7-3.5 7-8 7-8-7-8-7z"/>
            <circle cx="9" cy="9" r="2.5"/>
          </svg>
          Voir la vitrine
        </a>
      </header>

      <!-- KPI cards -->
      <div class="kpi-grid">
        <a routerLink="/admin/categories" class="kpi-card animate-up delay-1">
          <div class="kpi-icon kpi-icon-brand">
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M2 2.5h5.5l8 8-5.5 5.5-8-8V2.5z" stroke-linejoin="round"/>
              <circle cx="5.5" cy="5.5" r="1.2" fill="currentColor" stroke="none"/>
            </svg>
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ categories().length }}</div>
            <div class="kpi-label">Catégories</div>
          </div>
          <div class="kpi-arrow">→</div>
        </a>

        <a routerLink="/admin/menu-items" class="kpi-card animate-up delay-2">
          <div class="kpi-icon kpi-icon-slate">
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M4 1v4a2 2 0 002 2v9"/>
              <path d="M6 1v4M8 1v4"/>
              <path d="M13 1c0 0 2 1.2 2 5.5h-4C11 2.2 13 1 13 1z"/>
              <path d="M13 6.5V17"/>
            </svg>
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ totalItems() }}</div>
            <div class="kpi-label">Plats au total</div>
          </div>
          <div class="kpi-arrow">→</div>
        </a>

        <div class="kpi-card kpi-card-success animate-up delay-3">
          <div class="kpi-icon kpi-icon-success">
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <path d="M3 9l4 4 8-8" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ availableItems() }}</div>
            <div class="kpi-label">Disponibles</div>
          </div>
          <div class="kpi-percent">
            @if (totalItems() > 0) {
              {{ (availableItems() / totalItems() * 100) | number:'1.0-0' }}%
            }
          </div>
        </div>

        <div class="kpi-card kpi-card-warning animate-up delay-4">
          <div class="kpi-icon kpi-icon-warning">
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <path d="M9 3v6M9 13v1.5" stroke-linejoin="round"/>
              <path d="M1.5 15L9 2.5l7.5 12.5z" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ unavailableItems() }}</div>
            <div class="kpi-label">Indisponibles</div>
          </div>
        </div>
      </div>

      <div class="bottom-row">
        <!-- Restaurant card -->
        @if (restaurant()) {
          <div class="restaurant-card animate-up delay-3">
            <div class="rc-header">
              <h2 class="rc-title">Votre restaurant</h2>
              <a routerLink="/admin/restaurant" class="btn btn-sm btn-outline">Modifier</a>
            </div>
            <div class="rc-body">
              @if (restaurant()!.logoUrl) {
                <img [src]="restaurant()!.logoUrl" [alt]="restaurant()!.name" class="rc-logo" />
              } @else {
                <div class="rc-logo-placeholder">{{ restaurant()!.name[0] }}</div>
              }
              <div class="rc-info">
                <h3 class="rc-name">{{ restaurant()!.name }}</h3>
                @if (restaurant()!.slogan) {
                  <p class="rc-slogan">{{ restaurant()!.slogan }}</p>
                }
                <div class="rc-meta">
                  <div class="rc-color-dot" [style.background]="restaurant()!.brandColor"></div>
                  <span>{{ restaurant()!.brandColor }}</span>
                  <span class="rc-sep">·</span>
                  <span class="badge" [class]="subscriptionBadgeClass()">{{ subscriptionLabel() }}</span>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Actions rapides -->
        <div class="quick-actions animate-up delay-4">
          <h2 class="qa-title">Actions rapides</h2>
          <div class="qa-grid">
            <a routerLink="/admin/categories" class="qa-item">
              <div class="qa-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6">
                  <path d="M9 3v12M3 9h12" stroke-linecap="round"/>
                </svg>
              </div>
              <span>Catégorie</span>
            </a>
            <a routerLink="/admin/menu-items" class="qa-item">
              <div class="qa-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
                  <path d="M4 1v4a2 2 0 002 2v9"/><path d="M6 1v4M8 1v4"/>
                  <path d="M13 1c0 0 2 1.2 2 5.5h-4C11 2.2 13 1 13 1z"/>
                  <path d="M13 6.5V17"/>
                </svg>
              </div>
              <span>Nouveau plat</span>
            </a>
            <a routerLink="/admin/restaurant" class="qa-item">
              <div class="qa-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6">
                  <circle cx="9" cy="9" r="2.5"/>
                  <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.2 3.2l1.4 1.4M13.4 13.4l1.4 1.4M3.2 14.8l1.4-1.4M13.4 4.6l1.4-1.4" stroke-linecap="round"/>
                </svg>
              </div>
              <span>Charte</span>
            </a>
            <a routerLink="/menu" target="_blank" class="qa-item">
              <div class="qa-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6">
                  <path d="M1 9s3.5-7 8-7 8 7 8 7-3.5 7-8 7-8-7-8-7z"/>
                  <circle cx="9" cy="9" r="2.5"/>
                </svg>
              </div>
              <span>Vitrine</span>
            </a>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .dashboard { max-width: 960px; }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }
    @media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }

    .kpi-card {
      background: white;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      display: flex; align-items: flex-start; gap: var(--space-4);
      position: relative; text-decoration: none; color: inherit;
      transition: box-shadow var(--t-fast), transform var(--t-fast);
      &:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
    }
    .kpi-card-success { border-left: 3px solid var(--success); }
    .kpi-card-warning { border-left: 3px solid var(--warning); }

    .kpi-icon {
      width: 44px; height: 44px; flex-shrink: 0;
      border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
    }
    .kpi-icon-brand   { background: var(--brand-subtle); color: var(--brand); }
    .kpi-icon-slate   { background: var(--gray-100); color: var(--gray-600); }
    .kpi-icon-success { background: var(--success-bg); color: var(--success); }
    .kpi-icon-warning { background: var(--warning-bg); color: var(--warning); }

    .kpi-body { flex: 1; }
    .kpi-value { font-size: 1.875rem; font-weight: 700; color: var(--text-primary); line-height: 1; }
    .kpi-label { font-size: .8125rem; color: var(--text-muted); margin-top: 4px; }
    .kpi-arrow { position: absolute; top: var(--space-4); right: var(--space-4); color: var(--gray-300); font-size: 1.125rem; }
    .kpi-percent { position: absolute; top: var(--space-4); right: var(--space-4); font-size: .8125rem; font-weight: 600; color: var(--success); }

    /* Bottom row */
    .bottom-row {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: var(--space-4);
    }
    @media (max-width: 900px) { .bottom-row { grid-template-columns: 1fr; } }

    /* Restaurant card */
    .restaurant-card {
      background: white; border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: var(--space-6);
    }
    .rc-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: var(--space-5);
    }
    .rc-title { font-size: 1rem; font-weight: 600; color: var(--text-primary); font-family: var(--font-body); margin: 0; }
    .rc-body { display: flex; align-items: center; gap: var(--space-5); }
    .rc-logo { width: 64px; height: 64px; border-radius: var(--radius-lg); object-fit: cover; border: 1px solid var(--border); flex-shrink: 0; }
    .rc-logo-placeholder {
      width: 64px; height: 64px; border-radius: var(--radius-lg); flex-shrink: 0;
      background: var(--brand-light); color: var(--brand);
      font-size: 1.5rem; font-weight: 700; font-family: var(--font-display);
      display: flex; align-items: center; justify-content: center;
    }
    .rc-info { flex: 1; }
    .rc-name   { font-size: 1.125rem; font-weight: 700; color: var(--text-primary); margin: 0 0 var(--space-1); }
    .rc-slogan { color: var(--text-muted); font-style: italic; font-size: .875rem; margin: 0 0 var(--space-2); }
    .rc-meta {
      display: flex; align-items: center; gap: var(--space-2);
      font-size: .8125rem; color: var(--text-muted);
    }
    .rc-color-dot { width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--border); flex-shrink: 0; }
    .rc-sep { color: var(--gray-300); }

    /* Quick actions */
    .quick-actions {
      background: white; border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: var(--space-6);
    }
    .qa-title { font-size: 1rem; font-weight: 600; color: var(--text-primary); font-family: var(--font-body); margin: 0 0 var(--space-4); }
    .qa-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
    .qa-item {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
      padding: var(--space-4); background: var(--gray-50); border-radius: var(--radius-md);
      text-decoration: none; color: var(--text-secondary); font-size: .8125rem; font-weight: 500;
      border: 1px solid var(--border); transition: all var(--t-fast); text-align: center;
      &:hover { background: var(--brand-subtle); border-color: var(--brand-light); color: var(--brand); }
    }
    .qa-icon {
      width: 36px; height: 36px; border-radius: var(--radius-md);
      background: white; border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      transition: all var(--t-fast);
    }
    .qa-item:hover .qa-icon { background: var(--brand); border-color: var(--brand); color: white; }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly menuService       = inject(MenuService)
  private readonly restaurantService = inject(RestaurantService)
  private readonly authService       = inject(AuthService)

  readonly user        = this.authService.user
  readonly restaurant  = this.restaurantService.restaurant
  readonly categories  = this.menuService.categories
  readonly menuItems   = this.menuService.menuItems
  readonly totalItems      = computed(() => this.menuItems().length)
  readonly availableItems  = computed(() => this.menuItems().filter((i) => i.isAvailable).length)
  readonly unavailableItems = computed(() => this.menuItems().filter((i) => !i.isAvailable).length)

  readonly firstName = computed(() => {
    const name = this.user()?.fullName || 'Admin'
    return name.split(' ')[0]
  })

  readonly subscriptionLabel = computed(() => {
    const s = this.restaurant()?.subscriptionStatus
    return s === 'active' ? 'Actif' : s === 'trialing' ? 'Essai' : s === 'canceled' ? 'Expiré' : s ?? ''
  })

  readonly subscriptionBadgeClass = computed(() => {
    const s = this.restaurant()?.subscriptionStatus
    return s === 'active' ? 'badge badge-success' : s === 'trialing' ? 'badge badge-info' : 'badge badge-warning'
  })

  ngOnInit(): void {
    this.menuService.loadAdminCategories().subscribe()
    this.menuService.loadAdminItems().subscribe()
    this.restaurantService.loadAdmin().subscribe()
  }
}
