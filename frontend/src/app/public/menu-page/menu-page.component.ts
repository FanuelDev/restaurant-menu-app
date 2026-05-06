// frontend/src/app/public/menu-page/menu-page.component.ts
import { Component, inject, OnInit, OnDestroy, signal, computed, AfterViewInit, PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { TranslocoModule } from '@jsverse/transloco'
import { MenuService } from '../../shared/services/menu.service'
import { RestaurantService } from '../../shared/services/restaurant.service'
import { OrderService } from '../../shared/services/order.service'
import { ReservationService } from '../../shared/services/reservation.service'
import { HeroComponent } from '../hero/hero.component'
import { CategoryTabsComponent } from '../category-tabs/category-tabs.component'
import { DishCardComponent } from '../dish-card/dish-card.component'
import type { MenuItemBadge, CartItem, MenuItem, Order, CreateReservationPayload } from '../../shared/models'
import QRCode from 'qrcode'

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule, HeroComponent, CategoryTabsComponent, DishCardComponent],
  template: `
    <ng-container *transloco="let t">
    <div class="menu-page">
      <app-hero [restaurant]="restaurant()" />

      <div class="filter-section">
        <div class="container">
          <div class="filters">
            <div class="search-wrap">
              <span class="search-icon" aria-hidden="true">🔍</span>
              <input
                type="search"
                class="search-input"
                [placeholder]="t('public.menu.searchPlaceholder')"
                [value]="filters().search"
                (input)="onSearch($event)"
                [attr.aria-label]="t('public.menu.searchAriaLabel')"
              />
            </div>
            <div class="filter-chips" role="group" [attr.aria-label]="t('public.menu.filterAriaLabel')">
              @for (chip of filterChips; track chip.value) {
                <button
                  class="chip"
                  [class.chip-active]="filters().badge === chip.value"
                  (click)="setFilter(chip.value)"
                  [attr.aria-pressed]="filters().badge === chip.value"
                >
                  {{ chip.icon }} {{ t('public.menu.' + chip.key) }}
                </button>
              }
            </div>
          </div>
        </div>
      </div>

      <app-category-tabs
        [categories]="categoriesWithItems()"
        [activeCategoryId]="activeCategoryId()"
        (categorySelected)="scrollToCategory($event)"
      />

      <main class="menu-content container" id="menu-content">
        @if (loading()) {
          <div class="loading-grid">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="skeleton-card" aria-hidden="true"></div>
            }
          </div>
        } @else if (categoriesWithItems().length === 0) {
          <div class="empty-menu">
            <p>{{ t('public.menu.noResults') }}</p>
          </div>
        } @else {
          @for (cat of categoriesWithItems(); track cat.id) {
            <section [id]="'cat-' + cat.id" class="category-section">
              <div class="category-header">
                <h2 class="category-title">{{ cat.name }}</h2>
                @if (cat.description) {
                  <p class="category-desc">{{ cat.description }}</p>
                }
              </div>
              <div class="dishes-grid">
                @for (item of cat.menuItems; track item.id) {
                  <app-dish-card
                    [item]="item"
                    [cartEnabled]="hasOrders()"
                    [qty]="getCartQty(item.id)"
                    (add)="addToCart(item)"
                    (remove)="removeFromCart(item.id)"
                  />
                }
              </div>
            </section>
          }
        }
      </main>

      <!-- Reservation section -->
      @if (hasOrders()) {
        <section class="reservation-section">
          <div class="container">
            <div class="reservation-card">
              <div class="reservation-header">
                <div class="reservation-icon">📅</div>
                <div>
                  <h2 class="reservation-title">{{ t('publicOrder.reservationTitle') }}</h2>
                </div>
              </div>

              @if (reservationSuccess()) {
                <div class="reservation-success">
                  <div class="success-icon">✅</div>
                  <h3>{{ t('publicOrder.reservationSuccess') }}</h3>
                  <p>{{ t('publicOrder.reservationSuccessDesc') }}</p>
                  <button class="btn-outline" (click)="reservationSuccess.set(false)" type="button">
                    {{ t('publicOrder.backToMenu') }}
                  </button>
                </div>
              } @else {
                <form class="reservation-form" (ngSubmit)="submitReservation()" #resForm="ngForm">
                  <div class="form-row">
                    <div class="form-field">
                      <label class="form-label">{{ t('publicOrder.reservationDate') }}</label>
                      <input
                        type="date"
                        class="form-input"
                        [(ngModel)]="resDate" name="resDate"
                        [min]="todayDate"
                        required
                      />
                    </div>
                    <div class="form-field">
                      <label class="form-label">{{ t('publicOrder.reservationTime') }}</label>
                      <input
                        type="time"
                        class="form-input"
                        [(ngModel)]="resTime" name="resTime"
                        required
                      />
                    </div>
                    <div class="form-field form-field-sm">
                      <label class="form-label">{{ t('publicOrder.reservationGuests') }}</label>
                      <input
                        type="number"
                        class="form-input"
                        [(ngModel)]="resGuests" name="resGuests"
                        min="1" max="100" required
                      />
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-field">
                      <label class="form-label">{{ t('publicOrder.reservationName') }}</label>
                      <input
                        type="text"
                        class="form-input"
                        [(ngModel)]="resName" name="resName"
                        required
                      />
                    </div>
                    <div class="form-field">
                      <label class="form-label">{{ t('publicOrder.reservationPhone') }}</label>
                      <input
                        type="tel"
                        class="form-input"
                        [(ngModel)]="resPhone" name="resPhone"
                        required
                      />
                    </div>
                  </div>
                  <div class="form-field">
                    <label class="form-label">{{ t('publicOrder.reservationRequests') }}</label>
                    <textarea
                      class="form-input form-textarea"
                      [(ngModel)]="resRequests" name="resRequests"
                      rows="2"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    class="btn-primary"
                    [disabled]="reservationSubmitting() || resForm.invalid"
                  >
                    {{ reservationSubmitting() ? t('publicOrder.reservationSubmitting') : t('publicOrder.reservationSubmit') }}
                  </button>
                  @if (reservationError()) {
                    <p class="form-error">{{ reservationError() }}</p>
                  }
                </form>
              }
            </div>
          </div>
        </section>
      }

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
          <p class="footer-copy">{{ t('public.menu.footerUpdated') }}</p>
        </div>
      </footer>
    </div>

    <!-- Cart FAB -->
    @if (hasOrders() && cartCount() > 0 && !cartOpen() && !checkoutOpen() && !orderConfirmed()) {
      <button class="cart-fab" (click)="cartOpen.set(true)" type="button" aria-label="Open cart">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
        <span class="cart-fab-count">{{ cartCount() }}</span>
        <span class="cart-fab-total">{{ formatPrice(cartTotal()) }}</span>
      </button>
    }

    <!-- Cart drawer backdrop -->
    @if (cartOpen()) {
      <div class="drawer-backdrop" (click)="cartOpen.set(false)" aria-hidden="true"></div>
      <aside class="cart-drawer" role="dialog" [attr.aria-label]="t('publicOrder.cartTitle')">
        <div class="cart-drawer-header">
          <h2 class="cart-drawer-title">{{ t('publicOrder.cartTitle') }}</h2>
          <button class="drawer-close" (click)="cartOpen.set(false)" type="button" aria-label="Close">✕</button>
        </div>

        @if (cart().length === 0) {
          <div class="cart-empty">{{ t('publicOrder.cartEmpty') }}</div>
        } @else {
          <div class="cart-items">
            @for (ci of cart(); track ci.menuItem.id) {
              <div class="cart-item">
                <div class="cart-item-info">
                  <span class="cart-item-name">{{ ci.menuItem.name }}</span>
                  <span class="cart-item-price">{{ formatPrice(ci.menuItem.priceInCents * ci.quantity) }}</span>
                </div>
                <div class="cart-item-controls">
                  <button class="qty-btn-sm" (click)="removeFromCart(ci.menuItem.id)" type="button">−</button>
                  <span class="qty-val-sm">{{ ci.quantity }}</span>
                  <button class="qty-btn-sm" (click)="addToCart(ci.menuItem)" type="button">+</button>
                  <button class="remove-btn" (click)="removeItemFully(ci.menuItem.id)" type="button" aria-label="Remove">🗑</button>
                </div>
              </div>
            }
          </div>

          <div class="cart-summary">
            <div class="cart-total-row">
              <span>{{ t('publicOrder.total') }}</span>
              <strong>{{ formatPrice(cartTotal()) }}</strong>
            </div>
            <button class="btn-primary btn-full" (click)="openCheckout()" type="button">
              {{ t('publicOrder.checkoutBtn') }}
            </button>
          </div>
        }
      </aside>
    }

    <!-- Checkout modal -->
    @if (checkoutOpen()) {
      <div class="modal-backdrop" (click)="closeCheckout()" aria-modal="true" role="dialog">
        <div class="checkout-modal" (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="modal-header">
            <div class="modal-header-left">
              <div class="modal-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
              </div>
              <h2 class="modal-title">{{ t('publicOrder.checkoutTitle') }}</h2>
            </div>
            <button class="modal-close-btn" (click)="closeCheckout()" type="button" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M3 3l10 10M13 3L3 13"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <form (ngSubmit)="placeOrder()" #checkoutForm="ngForm">

              <!-- Section: Customer info -->
              <div class="modal-section">
                <p class="modal-section-label">Vos informations</p>
                <div class="form-field">
                  <label class="form-label">{{ t('publicOrder.customerName') }}</label>
                  <input type="text" class="form-input" [(ngModel)]="ckName" name="ckName"
                    placeholder="Ex: Jean Dupont" required autocomplete="name" />
                </div>
                <div class="form-row-2">
                  <div class="form-field">
                    <label class="form-label">{{ t('publicOrder.customerPhone') }}</label>
                    <input type="tel" class="form-input" [(ngModel)]="ckPhone" name="ckPhone"
                      placeholder="+229 XX XX XX XX" autocomplete="tel" />
                  </div>
                  <div class="form-field">
                    <label class="form-label">{{ t('publicOrder.customerEmail') }}</label>
                    <input type="email" class="form-input" [(ngModel)]="ckEmail" name="ckEmail"
                      placeholder="email@exemple.com" autocomplete="email" />
                  </div>
                </div>
                <div class="form-field">
                  <label class="form-label">{{ t('publicOrder.orderNotes') }}</label>
                  <textarea class="form-input form-textarea" [(ngModel)]="ckNotes" name="ckNotes"
                    rows="2" placeholder="Allergies, instructions particulières…"></textarea>
                </div>
              </div>

              <!-- Divider -->
              <div class="modal-divider"></div>

              <!-- Section: Gift option -->
              <div class="modal-section">
                <label class="gift-toggle-row">
                  <input type="checkbox" [(ngModel)]="ckIsGift" name="ckIsGift" class="gift-checkbox" />
                  <div class="gift-toggle-content">
                    <span class="gift-toggle-title">🎁 {{ t('publicOrder.isGift') }}</span>
                    <span class="gift-toggle-desc">Un QR code sera généré pour le destinataire</span>
                  </div>
                </label>
                @if (ckIsGift) {
                  <div class="gift-message-field">
                    <label class="form-label">{{ t('publicOrder.giftMessage') }}</label>
                    <textarea
                      class="form-input form-textarea gift-textarea"
                      [(ngModel)]="ckGiftMessage" name="ckGiftMessage"
                      [placeholder]="t('publicOrder.giftMessagePlaceholder')"
                      rows="3"
                    ></textarea>
                  </div>
                }
              </div>

              <!-- Divider -->
              <div class="modal-divider"></div>

              <!-- Section: Order summary -->
              <div class="modal-section">
                <p class="modal-section-label">Récapitulatif</p>
                <div class="modal-order-summary">
                  @for (ci of cart(); track ci.menuItem.id) {
                    <div class="modal-order-line">
                      <span class="order-line-name">
                        <span class="order-line-qty">{{ ci.quantity }}×</span>
                        {{ ci.menuItem.name }}
                      </span>
                      <span class="order-line-price">{{ formatPrice(ci.menuItem.priceInCents * ci.quantity) }}</span>
                    </div>
                  }
                  <div class="modal-order-total">
                    <span>{{ t('publicOrder.total') }}</span>
                    <strong class="total-amount">{{ formatPrice(cartTotal()) }}</strong>
                  </div>
                </div>
              </div>

              <!-- Error -->
              @if (orderError()) {
                <div class="form-error-box">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <circle cx="8" cy="8" r="6"/><path d="M8 5v3M8 11v.5"/>
                  </svg>
                  {{ orderError() }}
                </div>
              }

              <!-- Submit -->
              <div class="modal-footer">
                <button
                  type="submit"
                  class="btn-submit"
                  [disabled]="orderSubmitting() || checkoutForm.invalid"
                >
                  @if (orderSubmitting()) {
                    <span class="btn-spinner"></span>
                    {{ t('publicOrder.submitting') }}
                  } @else {
                    {{ t('publicOrder.submitOrder') }} · {{ formatPrice(cartTotal()) }}
                  }
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    }

    <!-- Order confirmation -->
    @if (orderConfirmed(); as order) {
      <div class="confirmation-overlay">
        <div class="confirmation-card">
          <div class="confirmation-icon">✅</div>
          <h2 class="confirmation-title">{{ t('publicOrder.confirmationTitle') }}</h2>
          <p class="confirmation-subtitle">{{ t('publicOrder.confirmationSubtitle') }}</p>
          <div class="confirmation-number">
            <span class="conf-label">{{ t('publicOrder.orderNumber') }}</span>
            <span class="conf-value">{{ order.orderNumber }}</span>
          </div>

          @if (order.isGift && order.giftToken) {
            <div class="qr-section">
              <h3 class="qr-title">{{ t('publicOrder.giftQrTitle') }}</h3>
              <p class="qr-desc">{{ t('publicOrder.giftQrDesc') }}</p>
              <canvas id="qr-canvas" class="qr-canvas"></canvas>
              <button class="btn-outline" (click)="downloadQr()" type="button">
                ⬇ {{ t('publicOrder.downloadQr') }}
              </button>
            </div>
          }

          <button class="btn-primary" (click)="dismissConfirmation()" type="button">
            {{ t('publicOrder.backToMenu') }}
          </button>
        </div>
      </div>
    }
    </ng-container>
  `,
  styles: [`
    .menu-page { min-height: 100vh; background: var(--bg); }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 var(--space-5); }

    .filter-section {
      background: var(--surface-1);
      border-bottom: 1px solid var(--border);
      padding: var(--space-4) 0;
      position: sticky;
      top: 0;
      z-index: 40;
    }
    .filters { display: flex; align-items: center; gap: var(--space-4); flex-wrap: wrap; }
    .search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 320px; }
    .search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); font-size: 0.9rem; }
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
    }
    .search-input:focus { outline: none; border-color: var(--color-brand); box-shadow: 0 0 0 3px var(--color-brand-light); }
    .filter-chips { display: flex; gap: var(--space-2); flex-wrap: wrap; }
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
    }
    .chip:hover { border-color: var(--color-brand); color: var(--color-brand); }
    .chip-active { background: var(--color-brand); border-color: var(--color-brand); color: white; }

    .menu-content { padding: var(--space-10) var(--space-5); }
    .category-section { margin-bottom: var(--space-14); scroll-margin-top: 130px; }
    .category-header { margin-bottom: var(--space-6); }
    .category-title {
      font-family: var(--font-display);
      font-size: clamp(1.75rem, 3vw, 2.5rem);
      color: var(--text-primary);
      margin: 0 0 var(--space-2);
      display: inline-block;
    }
    .category-title::after {
      content: '';
      display: block;
      width: 3rem;
      height: 3px;
      background: var(--color-brand);
      margin-top: var(--space-2);
      border-radius: 2px;
    }
    .category-desc { color: var(--text-muted); font-size: 1rem; margin: 0; }
    .dishes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
      gap: var(--space-5);
    }

    .loading-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-5); padding: var(--space-10) 0; }
    .skeleton-card {
      height: 320px;
      border-radius: var(--radius-lg);
      background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-1) 50%, var(--surface-2) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .empty-menu { text-align: center; padding: var(--space-20) 0; color: var(--text-muted); font-size: 1.125rem; }

    /* Reservation section */
    .reservation-section { background: var(--surface-1); border-top: 1px solid var(--border); padding: var(--space-12) 0; }
    .reservation-card {
      max-width: 700px;
      background: white;
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: var(--space-8);
      box-shadow: 0 2px 12px rgba(0,0,0,.06);
    }
    .reservation-header { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-6); }
    .reservation-icon { font-size: 2rem; }
    .reservation-title { font-size: 1.375rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .reservation-form { display: flex; flex-direction: column; gap: var(--space-4); }
    .reservation-success { text-align: center; padding: var(--space-8); }
    .reservation-success h3 { font-size: 1.25rem; color: var(--success); margin: var(--space-3) 0 var(--space-2); }
    .reservation-success p { color: var(--text-muted); margin: 0 0 var(--space-6); }
    .success-icon { font-size: 2.5rem; }

    /* Shared form styles */
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .form-field { display: flex; flex-direction: column; gap: 6px; }
    .form-field-sm { max-width: 120px; }
    .form-label { font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); }
    .form-input {
      padding: 10px 14px;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface-2);
      color: var(--text-primary);
      font-size: 0.9375rem;
      font-family: var(--font-body);
      box-sizing: border-box;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .form-input:focus { outline: none; border-color: var(--color-brand); box-shadow: 0 0 0 3px var(--color-brand-light); }
    .form-textarea { resize: vertical; min-height: 70px; }
    .form-error { color: var(--error); font-size: 0.875rem; margin: 0; }

    /* Buttons */
    .btn-primary {
      padding: 12px 24px;
      background: var(--color-brand);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .btn-primary:hover:not(:disabled) { opacity: 0.88; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary.btn-full { width: 100%; }
    .btn-outline {
      padding: 10px 20px;
      border: 1.5px solid var(--color-brand);
      background: transparent;
      color: var(--color-brand);
      border-radius: var(--radius-md);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .btn-outline:hover { background: var(--color-brand); color: white; }

    /* Menu footer */
    .menu-footer { background: var(--surface-1); border-top: 1px solid var(--border); padding: var(--space-8) 0; }
    .footer-content { display: flex; align-items: center; gap: var(--space-5); margin-bottom: var(--space-3); }
    .footer-logo { width: 48px; height: 48px; border-radius: var(--radius-md); object-fit: cover; }
    .footer-info { display: flex; flex-direction: column; gap: 2px; font-size: 0.9375rem; color: var(--text-secondary); }
    .footer-info strong { color: var(--text-primary); }
    .footer-info a { color: var(--color-brand); text-decoration: none; }
    .footer-copy { font-size: 0.8125rem; color: var(--text-muted); margin: 0; }

    /* Cart FAB */
    .cart-fab {
      position: fixed;
      bottom: var(--space-6);
      right: var(--space-6);
      z-index: 200;
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: 14px 20px;
      background: var(--color-brand);
      color: white;
      border: none;
      border-radius: var(--radius-full);
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,.25);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .cart-fab:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,.3); }
    .cart-fab-count {
      background: white;
      color: var(--color-brand);
      border-radius: 50%;
      min-width: 22px; height: 22px;
      font-size: 0.75rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }
    .cart-fab-total { font-size: 0.9375rem; }

    /* Cart drawer */
    .drawer-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.45);
      z-index: 300;
    }
    .cart-drawer {
      position: fixed;
      top: 0; right: 0; bottom: 0;
      width: min(400px, 100vw);
      background: white;
      z-index: 301;
      display: flex; flex-direction: column;
      box-shadow: -4px 0 32px rgba(0,0,0,.15);
    }
    .cart-drawer-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-5) var(--space-6);
      border-bottom: 1px solid var(--border);
    }
    .cart-drawer-title { font-size: 1.125rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .drawer-close {
      width: 32px; height: 32px;
      border: none; background: var(--gray-100);
      border-radius: 50%; cursor: pointer;
      font-size: 0.875rem; color: var(--text-secondary);
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s;
    }
    .drawer-close:hover { background: var(--gray-200); color: var(--text-primary); }
    .cart-empty { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 1rem; }
    .cart-items { flex: 1; overflow-y: auto; padding: var(--space-4) var(--space-6); display: flex; flex-direction: column; gap: var(--space-3); }
    .cart-item {
      display: flex; align-items: center; justify-content: space-between; gap: var(--space-3);
      padding: var(--space-3) 0;
      border-bottom: 1px solid var(--gray-100);
    }
    .cart-item:last-child { border-bottom: none; }
    .cart-item-info { flex: 1; min-width: 0; }
    .cart-item-name { display: block; font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cart-item-price { display: block; font-size: 0.875rem; color: var(--color-brand); font-weight: 600; }
    .cart-item-controls { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .qty-btn-sm {
      width: 26px; height: 26px; border-radius: 50%;
      border: 1.5px solid var(--border); background: white;
      font-size: 1rem; font-weight: 700; cursor: pointer; color: var(--text-primary);
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s;
    }
    .qty-btn-sm:hover { background: var(--gray-100); }
    .qty-val-sm { font-size: 0.9375rem; font-weight: 700; min-width: 22px; text-align: center; }
    .remove-btn { background: none; border: none; cursor: pointer; font-size: 1rem; opacity: 0.5; transition: opacity 0.15s; padding: 2px; }
    .remove-btn:hover { opacity: 1; }
    .cart-summary {
      padding: var(--space-5) var(--space-6);
      border-top: 1px solid var(--border);
      display: flex; flex-direction: column; gap: var(--space-4);
    }
    .cart-total-row { display: flex; justify-content: space-between; font-size: 1rem; }
    .cart-total-row strong { font-size: 1.125rem; color: var(--color-brand); }

    /* Checkout modal */
    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.5);
      z-index: 400;
      display: flex; align-items: flex-start; justify-content: center;
      padding: var(--space-6) var(--space-4);
      overflow-y: auto;
    }
    .checkout-modal {
      background: white;
      border-radius: var(--radius-xl);
      width: min(540px, 100%);
      box-shadow: 0 16px 60px rgba(0,0,0,.22);
      margin: auto;
      overflow: hidden;
    }

    /* Modal header */
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-5) var(--space-6);
      border-bottom: 1px solid var(--border);
      background: var(--gray-50);
    }
    .modal-header-left { display: flex; align-items: center; gap: var(--space-3); }
    .modal-header-icon {
      width: 36px; height: 36px; border-radius: var(--radius-md);
      background: var(--color-brand); color: white;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .modal-title { font-size: 1.0625rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .modal-close-btn {
      width: 32px; height: 32px; border-radius: 50%;
      border: none; background: var(--gray-200); color: var(--text-muted);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: background 0.15s, color 0.15s; flex-shrink: 0;
    }
    .modal-close-btn:hover { background: var(--gray-300); color: var(--text-primary); }

    /* Modal body */
    .modal-body { display: flex; flex-direction: column; }
    .modal-section { padding: var(--space-5) var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
    .modal-section-label {
      font-size: 0.75rem; font-weight: 700; letter-spacing: .07em;
      text-transform: uppercase; color: var(--text-muted);
      margin: 0 0 var(--space-1);
    }
    .modal-divider { height: 1px; background: var(--border); margin: 0 var(--space-6); }

    /* Form rows inside modal */
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }

    /* Gift toggle */
    .gift-toggle-row {
      display: flex; align-items: flex-start; gap: var(--space-3);
      padding: var(--space-4);
      background: var(--gray-50);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .gift-toggle-row:hover { border-color: var(--color-brand); background: var(--color-brand-light, #fef3f2); }
    .gift-checkbox { width: 18px; height: 18px; accent-color: var(--color-brand); cursor: pointer; flex-shrink: 0; margin-top: 2px; }
    .gift-toggle-content { display: flex; flex-direction: column; gap: 2px; }
    .gift-toggle-title { font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); }
    .gift-toggle-desc { font-size: 0.8125rem; color: var(--text-muted); }
    .gift-message-field { display: flex; flex-direction: column; gap: 6px; }
    .gift-textarea { border-color: #f59e0b40; background: #fffbeb; }
    .gift-textarea:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px #fef3c740; }

    /* Order summary inside modal */
    .modal-order-summary {
      background: var(--gray-50);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }
    .modal-order-line {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--gray-100);
      gap: var(--space-3);
    }
    .modal-order-line:last-of-type { border-bottom: none; }
    .order-line-name { font-size: 0.9rem; color: var(--text-secondary); display: flex; align-items: center; gap: var(--space-2); }
    .order-line-qty {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 24px; height: 20px;
      background: var(--gray-200); border-radius: 4px;
      font-size: 0.75rem; font-weight: 700; color: var(--text-primary);
      padding: 0 5px;
    }
    .order-line-price { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; }
    .modal-order-total {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-4);
      background: white;
      border-top: 1.5px solid var(--border);
    }
    .modal-order-total span { font-size: 0.9375rem; font-weight: 600; color: var(--text-secondary); }
    .total-amount { font-size: 1.25rem; font-weight: 800; color: var(--color-brand); }

    /* Error box */
    .form-error-box {
      display: flex; align-items: center; gap: var(--space-2);
      margin: 0 var(--space-6);
      padding: var(--space-3) var(--space-4);
      background: var(--error-bg, #fef2f2);
      border: 1px solid var(--error-border, #fecaca);
      border-radius: var(--radius-md);
      color: var(--error, #dc2626); font-size: 0.875rem;
    }

    /* Modal footer with submit button */
    .modal-footer {
      padding: var(--space-5) var(--space-6) var(--space-6);
      border-top: 1px solid var(--border);
      background: var(--gray-50);
    }
    .btn-submit {
      width: 100%;
      padding: 14px 24px;
      background: var(--color-brand);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: var(--space-2);
      transition: opacity 0.15s, transform 0.15s;
      letter-spacing: 0.01em;
    }
    .btn-submit:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .btn-submit:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
    .btn-spinner {
      width: 16px; height: 16px; border-radius: 50%;
      border: 2.5px solid rgba(255,255,255,.35);
      border-top-color: white;
      animation: spin 0.7s linear infinite; flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Order confirmation overlay */
    .confirmation-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.6);
      z-index: 500;
      display: flex; align-items: center; justify-content: center;
      padding: var(--space-5);
    }
    .confirmation-card {
      background: white;
      border-radius: var(--radius-xl);
      padding: var(--space-10) var(--space-8);
      width: min(480px, 100%);
      text-align: center;
      box-shadow: 0 8px 40px rgba(0,0,0,.25);
      display: flex; flex-direction: column; align-items: center; gap: var(--space-4);
      max-height: 90vh; overflow-y: auto;
    }
    .confirmation-icon { font-size: 3rem; }
    .confirmation-title { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0; }
    .confirmation-subtitle { color: var(--text-muted); margin: 0; font-size: 1rem; }
    .confirmation-number {
      display: flex; flex-direction: column; gap: 4px;
      background: var(--gray-50); border-radius: var(--radius-md);
      padding: var(--space-4) var(--space-6); width: 100%;
    }
    .conf-label { font-size: 0.8125rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
    .conf-value { font-size: 1.25rem; font-weight: 800; color: var(--text-primary); font-family: monospace; }
    .qr-section {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-3);
      width: 100%;
      border-top: 1px solid var(--border);
      padding-top: var(--space-4);
    }
    .qr-title { font-size: 1rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .qr-desc { font-size: 0.875rem; color: var(--text-muted); margin: 0; }
    .qr-canvas { border-radius: var(--radius-md); border: 4px solid white; box-shadow: 0 2px 12px rgba(0,0,0,.12); }
  `],
})
export class MenuPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly menuService = inject(MenuService)
  private readonly restaurantService = inject(RestaurantService)
  private readonly orderService = inject(OrderService)
  private readonly reservationService = inject(ReservationService)
  private readonly platformId = inject(PLATFORM_ID)

  readonly restaurant = this.restaurantService.restaurant
  readonly loading = this.menuService.loading
  readonly filters = this.menuService.filters
  readonly categoriesWithItems = this.menuService.categoriesWithItems
  readonly activeCategoryId = signal<number | null>(null)

  // Enterprise feature flag
  readonly hasOrders = signal(false)

  // Cart state
  readonly cart = signal<CartItem[]>([])
  readonly cartOpen = signal(false)
  readonly checkoutOpen = signal(false)
  readonly orderConfirmed = signal<Order | null>(null)

  readonly cartCount = computed(() => this.cart().reduce((s, ci) => s + ci.quantity, 0))
  readonly cartTotal = computed(() => this.cart().reduce((s, ci) => s + ci.menuItem.priceInCents * ci.quantity, 0))

  // Checkout form fields
  ckName = ''
  ckPhone = ''
  ckEmail = ''
  ckNotes = ''
  ckIsGift = false
  ckGiftMessage = ''
  readonly orderSubmitting = signal(false)
  readonly orderError = signal<string | null>(null)

  // Reservation form fields
  resDate = ''
  resTime = ''
  resGuests = 2
  resName = ''
  resPhone = ''
  resRequests = ''
  readonly reservationSubmitting = signal(false)
  readonly reservationSuccess = signal(false)
  readonly reservationError = signal<string | null>(null)

  get todayDate(): string {
    return new Date().toISOString().split('T')[0]
  }

  readonly filterChips: { value: MenuItemBadge | 'all'; icon: string; key: string }[] = [
    { value: 'all', icon: '🍽️', key: 'filterAll' },
    { value: 'popular', icon: '⭐', key: 'filterPopular' },
    { value: 'new', icon: '✨', key: 'filterNew' },
    { value: 'vegetarian', icon: '🌿', key: 'filterVegetarian' },
    { value: 'spicy', icon: '🌶️', key: 'filterSpicy' },
  ]

  private observer?: IntersectionObserver

  ngOnInit(): void {
    this.restaurantService.loadPublic().subscribe()
    this.menuService.loadPublicMenu().subscribe()
    this.orderService.checkFeature().subscribe({
      next: (res) => this.hasOrders.set(res.ordersAndReservations),
      error: () => this.hasOrders.set(false),
    })
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return
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
    setTimeout(() => {
      document.querySelectorAll('.category-section').forEach((el) => this.observer!.observe(el))
    }, 500)
  }

  ngOnDestroy(): void {
    this.observer?.disconnect()
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

  // Cart methods
  getCartQty(menuItemId: number): number {
    return this.cart().find((ci) => ci.menuItem.id === menuItemId)?.quantity ?? 0
  }

  addToCart(item: MenuItem): void {
    this.cart.update((cart) => {
      const existing = cart.find((ci) => ci.menuItem.id === item.id)
      if (existing) {
        return cart.map((ci) =>
          ci.menuItem.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        )
      }
      return [...cart, { menuItem: item, quantity: 1, specialInstructions: '' }]
    })
  }

  removeFromCart(menuItemId: number): void {
    this.cart.update((cart) => {
      const existing = cart.find((ci) => ci.menuItem.id === menuItemId)
      if (!existing || existing.quantity <= 1) {
        return cart.filter((ci) => ci.menuItem.id !== menuItemId)
      }
      return cart.map((ci) =>
        ci.menuItem.id === menuItemId ? { ...ci, quantity: ci.quantity - 1 } : ci
      )
    })
  }

  removeItemFully(menuItemId: number): void {
    this.cart.update((cart) => cart.filter((ci) => ci.menuItem.id !== menuItemId))
  }

  openCheckout(): void {
    this.cartOpen.set(false)
    this.checkoutOpen.set(true)
  }

  closeCheckout(): void {
    this.checkoutOpen.set(false)
  }

  placeOrder(): void {
    if (this.orderSubmitting()) return
    this.orderSubmitting.set(true)
    this.orderError.set(null)

    this.orderService.placeOrder({
      customerName: this.ckName,
      customerPhone: this.ckPhone || null,
      customerEmail: this.ckEmail || null,
      notes: this.ckNotes || null,
      isGift: this.ckIsGift,
      giftMessage: this.ckIsGift ? (this.ckGiftMessage || null) : null,
      items: this.cart().map((ci) => ({
        menuItemId: ci.menuItem.id,
        quantity: ci.quantity,
        specialInstructions: ci.specialInstructions || null,
      })),
    }).subscribe({
      next: (order) => {
        this.orderSubmitting.set(false)
        this.checkoutOpen.set(false)
        this.cart.set([])
        this.ckName = ''; this.ckPhone = ''; this.ckEmail = ''; this.ckNotes = ''
        this.ckIsGift = false; this.ckGiftMessage = ''
        this.orderConfirmed.set(order)
        if (order.isGift && order.giftToken) {
          setTimeout(() => this.renderQr(order.giftToken!), 100)
        }
      },
      error: (err) => {
        this.orderSubmitting.set(false)
        this.orderError.set(err?.error?.message || 'An error occurred. Please try again.')
      },
    })
  }

  dismissConfirmation(): void {
    this.orderConfirmed.set(null)
  }

  private renderQr(token: string): void {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement | null
    if (!canvas) return
    const url = `${window.location.origin}/redeem/${token}`
    QRCode.toCanvas(canvas, url, { width: 220, margin: 2 }, () => {})
  }

  downloadQr(): void {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement | null
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'gift-qr.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  submitReservation(): void {
    if (this.reservationSubmitting()) return
    this.reservationSubmitting.set(true)
    this.reservationError.set(null)

    const payload: CreateReservationPayload = {
      reservedDate: this.resDate,
      reservedTime: this.resTime,
      guestsCount: this.resGuests,
      customerName: this.resName,
      customerPhone: this.resPhone,
      customerEmail: null,
      specialRequests: this.resRequests || null,
    }

    this.reservationService.createReservation(payload).subscribe({
      next: () => {
        this.reservationSubmitting.set(false)
        this.reservationSuccess.set(true)
        this.resDate = ''; this.resTime = ''; this.resGuests = 2
        this.resName = ''; this.resPhone = ''; this.resRequests = ''
      },
      error: (err) => {
        this.reservationSubmitting.set(false)
        this.reservationError.set(err?.error?.message || 'An error occurred. Please try again.')
      },
    })
  }

  formatPrice(cents: number): string {
    const currency = this.restaurant()?.currency || 'EUR'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(cents / 100)
  }
}
