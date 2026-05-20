// frontend/src/app/public/dish-card/dish-card.component.ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslocoModule } from '@jsverse/transloco'
import { trigger, state, style, animate, transition } from '@angular/animations'
import type { MenuItem, MenuItemBadge } from '../../shared/models'

const BADGE_CONFIG: Record<string, { key: string; icon: string; cssClass: string }> = {
  new:        { key: 'public.menu.badgeNew',        icon: '✨', cssClass: 'badge-new' },
  popular:    { key: 'public.menu.badgePopular',    icon: '⭐', cssClass: 'badge-popular' },
  vegetarian: { key: 'public.menu.badgeVegetarian', icon: '🌿', cssClass: 'badge-vegetarian' },
  spicy:      { key: 'public.menu.badgeSpicy',       icon: '🌶️', cssClass: 'badge-spicy' },
}

@Component({
  selector: 'app-dish-card',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('cardReveal', [
      state('void', style({ opacity: 0, transform: 'translateY(20px)' })),
      transition(':enter', [
        animate('0.5s cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  templateUrl: './dish-card.component.html',
  styles: [`
    .dish-card {
      background: var(--surface-1);
      border-radius: var(--radius-xl);
      border: 1px solid var(--border);
      overflow: hidden;
      cursor: default;
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      outline-offset: 3px;
    }
    .dish-card:hover,
    .dish-card:focus-visible {
      transform: translateY(-4px) scale(1.012);
      box-shadow: 0 8px 16px rgba(0,0,0,0.06), 0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px var(--color-brand-light);
    }
    .dish-card:hover .dish-image { transform: scale(1.06); }
    .dish-card-unavailable { pointer-events: none; }

    .dish-image-wrap {
      position: relative;
      height: 200px;
      overflow: hidden;
      background: var(--surface-2);
    }
    .dish-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      display: block;
    }
    .dish-image-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      font-size: 3.5rem;
      color: var(--text-muted);
    }
    .dish-unavailable-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.9);
      font-size: 0.9375rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

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
    }
    .badge-new        { background: rgba(59,130,246,0.9);  color: white; }
    .badge-popular    { background: rgba(245,158,11,0.9);  color: white; }
    .badge-vegetarian { background: rgba(34,197,94,0.9);   color: white; }
    .badge-spicy      { background: rgba(239,68,68,0.9);   color: white; }

    .dish-body { padding: var(--space-5); }
    .dish-top {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: var(--space-3);
      margin-bottom: var(--space-2);
    }
    .dish-name { font-size: 1.0625rem; font-weight: 600; color: var(--text-primary); margin: 0; line-height: 1.3; }
    .dish-price { font-size: 1.125rem; font-weight: 700; color: var(--color-brand); white-space: nowrap; font-variant-numeric: tabular-nums; }
    .dish-desc {
      color: var(--text-muted);
      font-size: 0.875rem;
      line-height: 1.6;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .dish-cart-row {
      margin-top: var(--space-4);
      display: flex;
      justify-content: flex-end;
    }
    .dish-add-btn {
      padding: 7px 16px;
      border-radius: var(--radius-full);
      border: 1.5px solid var(--color-brand);
      background: transparent;
      color: var(--color-brand);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .dish-add-btn:hover { background: var(--color-brand); color: white; }
    .dish-qty-ctrl {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      background: var(--gray-100);
      border-radius: var(--radius-full);
      padding: 4px 6px;
    }
    .qty-btn {
      width: 28px; height: 28px;
      border-radius: 50%; border: none;
      background: white; color: var(--text-primary);
      font-size: 1.1rem; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 1px 3px rgba(0,0,0,.12);
      transition: background 0.15s;
    }
    .qty-btn:hover { background: var(--gray-200); }
    .qty-val { font-size: 0.9375rem; font-weight: 700; min-width: 24px; text-align: center; color: var(--text-primary); }
  `],
})
export class DishCardComponent {
  @Input({ required: true }) item!: MenuItem
  @Input() cartEnabled = false
  @Input() qty = 0
  @Input() currency = 'XOF'
  @Output() add = new EventEmitter<void>()
  @Output() remove = new EventEmitter<void>()

  getBadge(badge: MenuItemBadge) {
    return badge ? BADGE_CONFIG[badge] ?? null : null
  }

  formatPrice(amount: number): string {
    if (this.item.priceFormatted) return this.item.priceFormatted
    try {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: this.currency, minimumFractionDigits: 0 }).format(amount)
    } catch {
      return `${amount} ${this.currency}`
    }
  }
}
