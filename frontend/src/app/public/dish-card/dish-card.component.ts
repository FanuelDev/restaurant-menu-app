// frontend/src/app/public/dish-card/dish-card.component.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { trigger, state, style, animate, transition } from '@angular/animations'
import type { MenuItem, MenuItemBadge } from '../../shared/models'

const BADGE_CONFIG: Record<string, { label: string; icon: string; class: string }> = {
  new:        { label: 'Nouveau',     icon: '✨', class: 'badge--new' },
  popular:    { label: 'Populaire',   icon: '⭐', class: 'badge--popular' },
  vegetarian: { label: 'Végétarien', icon: '🌿', class: 'badge--vegetarian' },
  spicy:      { label: 'Épicé',       icon: '🌶️', class: 'badge--spicy' },
}

@Component({
  selector: 'app-dish-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('cardReveal', [
      state('void', style({ opacity: 0, transform: 'translateY(20px)' })),
      transition(':enter', [
        animate('0.5s cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  template: `
    <article
      class="dish-card"
      [class.dish-card--unavailable]="!item.isAvailable"
      @cardReveal
      tabindex="0"
      [attr.aria-label]="item.name + ' — ' + formatPrice(item.priceInCents)"
    >
      <!-- Image -->
      <div class="dish-card__image-wrap">
        @if (item.imageUrl) {
          <img
            [src]="item.imageUrl"
            [alt]="item.name"
            class="dish-card__image"
            loading="lazy"
          />
        } @else {
          <div class="dish-card__image-fallback" aria-hidden="true">🍽️</div>
        }

        <!-- Badge -->
        @if (item.badge && getBadge(item.badge)) {
          <span
            class="dish-badge"
            [ngClass]="getBadge(item.badge)!.class"
            [attr.aria-label]="getBadge(item.badge)!.label"
          >
            {{ getBadge(item.badge)!.icon }} {{ getBadge(item.badge)!.label }}
          </span>
        }

        <!-- Indisponible -->
        @if (!item.isAvailable) {
          <div class="dish-card__unavailable-overlay" aria-label="Indisponible">
            <span>Indisponible</span>
          </div>
        }
      </div>

      <!-- Corps -->
      <div class="dish-card__body">
        <div class="dish-card__top">
          <h3 class="dish-card__name">{{ item.name }}</h3>
          <span class="dish-card__price" aria-label="Prix">{{ formatPrice(item.priceInCents) }}</span>
        </div>

        @if (item.description) {
          <p class="dish-card__desc">{{ item.description }}</p>
        }
      </div>
    </article>
  `,
  styles: [`
    .dish-card {
      background: var(--surface-1);
      border-radius: var(--radius-xl);
      border: 1px solid var(--border);
      overflow: hidden;
      cursor: default;
      transition:
        transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      outline-offset: 3px;

      &:hover, &:focus-visible {
        transform: translateY(-4px) scale(1.012);
        box-shadow:
          0 8px 16px rgba(0, 0, 0, 0.06),
          0 20px 40px rgba(0, 0, 0, 0.1),
          0 0 0 1px var(--color-brand-light);
      }

      &:hover .dish-card__image { transform: scale(1.06); }

      &--unavailable {
        pointer-events: none;
      }
    }

    /* ── Image ───────────────────────────────────────────────────────────── */
    .dish-card__image-wrap {
      position: relative;
      height: 200px;
      overflow: hidden;
      background: var(--surface-2);
    }

    .dish-card__image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      display: block;
    }

    .dish-card__image-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      font-size: 3.5rem;
      color: var(--text-muted);
    }

    .dish-card__unavailable-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.9375rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    /* ── Badge ───────────────────────────────────────────────────────────── */
    .dish-badge {
      position: absolute;
      top: var(--space-3);
      left: var(--space-3);
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      gap: 4px;

      &.badge--new        { background: rgba(59, 130, 246, 0.9); color: white; }
      &.badge--popular    { background: rgba(245, 158, 11, 0.9); color: white; }
      &.badge--vegetarian { background: rgba(34, 197, 94, 0.9);  color: white; }
      &.badge--spicy      { background: rgba(239, 68, 68, 0.9);  color: white; }
    }

    /* ── Corps ───────────────────────────────────────────────────────────── */
    .dish-card__body {
      padding: var(--space-5);
    }

    .dish-card__top {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: var(--space-3);
      margin-bottom: var(--space-2);
    }

    .dish-card__name {
      font-size: 1.0625rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.3;
    }

    .dish-card__price {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-brand);
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }

    .dish-card__desc {
      color: var(--text-muted);
      font-size: 0.875rem;
      line-height: 1.6;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `],
})
export class DishCardComponent {
  @Input({ required: true }) item!: MenuItem

  getBadge(badge: MenuItemBadge) {
    return badge ? BADGE_CONFIG[badge] ?? null : null
  }

  formatPrice(cents: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)
  }
}
