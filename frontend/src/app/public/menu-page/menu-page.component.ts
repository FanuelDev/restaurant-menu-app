// frontend/src/app/public/menu-page/menu-page.component.ts
import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  AfterViewInit,
  ElementRef,
  ViewChild,
  PLATFORM_ID,
} from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { CommonModule } from '@angular/common'
import { MenuService } from '../../shared/services/menu.service'
import { RestaurantService } from '../../shared/services/restaurant.service'
import { HeroComponent } from '../hero/hero.component'
import { CategoryTabsComponent } from '../category-tabs/category-tabs.component'
import { DishCardComponent } from '../dish-card/dish-card.component'
import type { MenuItemBadge } from '../../shared/models'

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [CommonModule, HeroComponent, CategoryTabsComponent, DishCardComponent],
  template: `
    <div class="menu-page">
      <!-- Hero -->
      <app-hero [restaurant]="restaurant()" />

      <!-- Barre de filtres + recherche -->
      <div class="filter-section">
        <div class="container">
          <div class="filters">
            <div class="search-wrap">
              <span class="search-icon" aria-hidden="true">🔍</span>
              <input
                type="search"
                class="search-input"
                placeholder="Rechercher un plat…"
                [value]="filters().search"
                (input)="onSearch($event)"
                aria-label="Rechercher un plat"
              />
            </div>

            <div class="filter-chips" role="group" aria-label="Filtrer par type">
              @for (chip of filterChips; track chip.value) {
                <button
                  class="chip"
                  [class.chip--active]="filters().badge === chip.value"
                  (click)="setFilter(chip.value)"
                  [attr.aria-pressed]="filters().badge === chip.value"
                >
                  {{ chip.icon }} {{ chip.label }}
                </button>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation catégories (sticky) -->
      <app-category-tabs
        [categories]="categoriesWithItems()"
        [activeCategoryId]="activeCategoryId()"
        (categorySelected)="scrollToCategory($event)"
      />

      <!-- Contenu menu -->
      <main class="menu-content container" id="menu-content">
        @if (loading()) {
          <div class="loading-grid">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="skeleton-card" aria-hidden="true"></div>
            }
          </div>
        } @else if (categoriesWithItems().length === 0) {
          <div class="empty-menu">
            <p>Aucun plat ne correspond à votre recherche.</p>
          </div>
        } @else {
          @for (cat of categoriesWithItems(); track cat.id) {
            <section
              [id]="'cat-' + cat.id"
              class="category-section"
              #categorySection
            >
              <div class="category-header">
                <h2 class="category-title">{{ cat.name }}</h2>
                @if (cat.description) {
                  <p class="category-desc">{{ cat.description }}</p>
                }
              </div>

              <div class="dishes-grid">
                @for (item of cat.menuItems; track item.id) {
                  <app-dish-card [item]="item" />
                }
              </div>
            </section>
          }
        }
      </main>

      <!-- Footer -->
      <footer class="menu-footer">
        <div class="container">
          @if (restaurant()) {
            <div class="footer-content">
              @if (restaurant()!.logoUrl) {
                <img [src]="restaurant()!.logoUrl" [alt]="restaurant()!.name" class="footer-logo" />
              }
              <div class="footer-info">
                <strong>{{ restaurant()!.name }}</strong>
                @if (restaurant()!.address) { <span>{{ restaurant()!.address }}</span> }
                @if (restaurant()!.phone) { <a [href]="'tel:' + restaurant()!.phone">{{ restaurant()!.phone }}</a> }
              </div>
            </div>
          }
          <p class="footer-copy">Menu mis à jour en temps réel</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .menu-page {
      min-height: 100vh;
      background: var(--bg);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--space-5);
    }

    /* ── Filtres ─────────────────────────────────────────────────────────── */
    .filter-section {
      background: var(--surface-1);
      border-bottom: 1px solid var(--border);
      padding: var(--space-4) 0;
      position: sticky;
      top: 0;
      z-index: 40;
    }

    .filters {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      flex-wrap: wrap;
    }

    .search-wrap {
      position: relative;
      flex: 1;
      min-width: 200px;
      max-width: 320px;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.9rem;
    }

    .search-input {
      width: 100%;
      padding: 0.5rem 1rem 0.5rem 2.25rem;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-full);
      background: var(--surface-2);
      color: var(--text-primary);
      font-size: 0.9375rem;
      font-family: var(--font-body);
      box-sizing: border-box;
      transition: border-color 0.2s, box-shadow 0.2s;

      &:focus {
        outline: none;
        border-color: var(--color-brand);
        box-shadow: 0 0 0 3px var(--color-brand-light);
      }
    }

    .filter-chips {
      display: flex;
      gap: var(--space-2);
      flex-wrap: wrap;
    }

    .chip {
      padding: 0.375rem 0.875rem;
      border-radius: var(--radius-full);
      border: 1.5px solid var(--border);
      background: var(--surface-1);
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;

      &:hover { border-color: var(--color-brand); color: var(--color-brand); }
      &--active { background: var(--color-brand); border-color: var(--color-brand); color: white; }
    }

    /* ── Sections catégories ─────────────────────────────────────────────── */
    .menu-content { padding: var(--space-10) var(--space-5); }

    .category-section { margin-bottom: var(--space-14); scroll-margin-top: 130px; }

    .category-header { margin-bottom: var(--space-6); }
    .category-title {
      font-family: var(--font-display);
      font-size: clamp(1.75rem, 3vw, 2.5rem);
      color: var(--text-primary);
      margin: 0 0 var(--space-2);
      position: relative;
      display: inline-block;

      &::after {
        content: '';
        display: block;
        width: 3rem;
        height: 3px;
        background: var(--color-brand);
        margin-top: var(--space-2);
        border-radius: 2px;
      }
    }

    .category-desc { color: var(--text-muted); font-size: 1rem; margin: 0; }

    .dishes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
      gap: var(--space-5);
    }

    /* ── Skeleton loading ────────────────────────────────────────────────── */
    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--space-5);
      padding: var(--space-10) 0;
    }

    .skeleton-card {
      height: 320px;
      border-radius: var(--radius-lg);
      background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-1) 50%, var(--surface-2) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .empty-menu { text-align: center; padding: var(--space-20) 0; color: var(--text-muted); font-size: 1.125rem; }

    /* ── Footer ──────────────────────────────────────────────────────────── */
    .menu-footer {
      background: var(--surface-1);
      border-top: 1px solid var(--border);
      padding: var(--space-8) 0;
    }

    .footer-content {
      display: flex;
      align-items: center;
      gap: var(--space-5);
      margin-bottom: var(--space-3);
    }

    .footer-logo { width: 48px; height: 48px; border-radius: var(--radius-md); object-fit: cover; }

    .footer-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.9375rem;
      color: var(--text-secondary);

      strong { color: var(--text-primary); }
      a { color: var(--color-brand); text-decoration: none; }
    }

    .footer-copy { font-size: 0.8125rem; color: var(--text-muted); margin: 0; }
  `],
})
export class MenuPageComponent implements OnInit, AfterViewInit {
  private readonly menuService = inject(MenuService)
  private readonly restaurantService = inject(RestaurantService)
  private readonly platformId = inject(PLATFORM_ID)

  readonly restaurant = this.restaurantService.restaurant
  readonly loading = this.menuService.loading
  readonly filters = this.menuService.filters
  readonly categoriesWithItems = this.menuService.categoriesWithItems
  readonly activeCategoryId = signal<number | null>(null)

  readonly filterChips: { value: MenuItemBadge | 'all'; icon: string; label: string }[] = [
    { value: 'all', icon: '🍽️', label: 'Tout' },
    { value: 'popular', icon: '⭐', label: 'Populaires' },
    { value: 'new', icon: '✨', label: 'Nouveautés' },
    { value: 'vegetarian', icon: '🌿', label: 'Végétarien' },
    { value: 'spicy', icon: '🌶️', label: 'Épicé' },
  ]

  private observer?: IntersectionObserver

  ngOnInit(): void {
    this.restaurantService.loadPublic().subscribe()
    this.menuService.loadPublicMenu().subscribe()
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return
    // Scrollspy — détecte la section visible et met à jour l'onglet actif
    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting)
        if (visible) {
          const id = Number(visible.target.id.replace('cat-', ''))
          this.activeCategoryId.set(id)
        }
      },
      { threshold: 0.3, rootMargin: '-100px 0px -60% 0px' }
    )

    // Observe après que les catégories soient rendues
    setTimeout(() => {
      document.querySelectorAll('.category-section').forEach((el) => this.observer!.observe(el))
    }, 500)
  }

  onSearch(event: Event): void {
    this.menuService.setFilter({ search: (event.target as HTMLInputElement).value })
  }

  setFilter(badge: MenuItemBadge | 'all'): void {
    this.menuService.setFilter({ badge })
  }

  scrollToCategory(id: number): void {
    const el = document.getElementById(`cat-${id}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    this.activeCategoryId.set(id)
  }
}
