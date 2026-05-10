import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { TranslocoModule } from '@jsverse/transloco'
import { OrderService } from '../../shared/services/order.service'
import { AuthService } from '../../shared/services/auth.service'
import type { Order, OrderStatus } from '../../shared/models'

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:   '#F59E0B',
  confirmed: '#3B82F6',
  preparing: '#8B5CF6',
  ready:     '#10B981',
  delivered: '#6B7280',
  cancelled: '#EF4444',
}

const STATUS_BG: Record<OrderStatus, string> = {
  pending:   '#FFFBEB',
  confirmed: '#EFF6FF',
  preparing: '#F5F3FF',
  ready:     '#ECFDF5',
  delivered: '#F9FAFB',
  cancelled: '#FEF2F2',
}

const ALL_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      <div class="orders-page">

        <!-- Enterprise locked banner -->
        @if (!hasAccess()) {
          <div class="locked-banner">
            <div class="locked-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div class="locked-content">
              <div class="locked-title">{{ t('orders.lockedTitle') }}</div>
              <div class="locked-desc">{{ t('orders.lockedDesc') }}</div>
              <a routerLink="/admin/subscription" class="locked-cta">
                {{ t('orders.lockedCta') }}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            </div>
          </div>
        }

        <!-- Full orders management -->
        @if (hasAccess()) {
          <!-- Page header -->
          <div class="page-header">
            <div>
              <h1 class="page-title">{{ t('orders.title') }}</h1>
              <p class="page-sub">{{ t('orders.subtitle') }}</p>
            </div>
          </div>

          <!-- QR Scanner panel -->
          <div class="scanner-panel">
            <button class="scanner-toggle" (click)="scannerOpen.set(!scannerOpen())">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              {{ t('orders.scannerToggle') }}
              <svg class="chevron" [class.chevron-open]="scannerOpen()" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            @if (scannerOpen()) {
              <div class="scanner-body">
                <div class="scanner-input-row">
                  <input
                    type="text"
                    class="scanner-input"
                    [(ngModel)]="scanTokenValue"
                    [placeholder]="t('orders.scannerPlaceholder')"
                    (keyup.enter)="runScan()"
                  />
                  <button class="scanner-btn" (click)="runScan()" [disabled]="scanning()">
                    @if (scanning()) {
                      <span class="spinner-sm"></span>
                    } @else {
                      {{ t('orders.scannerBtn') }}
                    }
                  </button>
                </div>

                @if (scanError()) {
                  <div class="scan-error">{{ scanError() }}</div>
                }

                @if (scannedOrder()) {
                  <div class="scanned-card">
                    <div class="scanned-card-row">
                      <div>
                        <div class="scanned-number">#{{ scannedOrder()!.orderNumber }}</div>
                        <div class="scanned-customer">{{ scannedOrder()!.customerName }}</div>
                      </div>
                      <div class="status-badge" [style.color]="statusColor(scannedOrder()!.status)" [style.background]="statusBg(scannedOrder()!.status)">
                        {{ t('orders.status.' + scannedOrder()!.status) }}
                      </div>
                    </div>
                    <div class="scanned-total">{{ formatPrice(scannedOrder()!.total) }}</div>
                    @if (scannedOrder()!.isGift) {
                      <div class="scanned-gift-info">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/></svg>
                        @if (scannedOrder()!.giftRevokedAt) {
                          <span class="gift-status-revoked">{{ t('orders.giftRevoked') }}</span>
                        } @else if (scannedOrder()!.giftRedeemedAt) {
                          <span class="gift-status-redeemed">{{ t('orders.giftRedeemed') }}</span>
                        } @else {
                          <span class="gift-status-pending">{{ t('orders.giftPending') }}</span>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>

          <!-- Filter bar -->
          <div class="filter-bar">
            <div class="filter-tabs">
              <button class="tab" [class.tab-active]="activeTab() === 'all'" (click)="setTab('all')">
                {{ t('orders.tabAll') }}
              </button>
              <button class="tab" [class.tab-active]="activeTab() === 'pending'" (click)="setTab('pending')">
                {{ t('orders.tabPending') }}
              </button>
              <button class="tab" [class.tab-active]="activeTab() === 'confirmed'" (click)="setTab('confirmed')">
                {{ t('orders.tabConfirmed') }}
              </button>
              <button class="tab" [class.tab-active]="activeTab() === 'gift'" (click)="setTab('gift')">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/></svg>
                {{ t('orders.tabGifts') }}
              </button>
            </div>
            <div class="search-wrap">
              <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                class="search-input"
                [(ngModel)]="searchQuery"
                [placeholder]="t('orders.searchPlaceholder')"
                (input)="onSearch()"
              />
            </div>
          </div>

          <!-- Loading skeleton -->
          @if (loading()) {
            <div class="orders-list">
              @for (_ of [1,2,3,4]; track $index) {
                <div class="order-card skeleton-card">
                  <div class="skeleton" style="height:16px;width:35%;margin-bottom:8px;border-radius:6px"></div>
                  <div class="skeleton" style="height:12px;width:55%;border-radius:4px"></div>
                </div>
              }
            </div>
          }

          <!-- Orders list -->
          @if (!loading()) {
            @if (orders().length === 0) {
              <div class="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="color:var(--text-secondary);opacity:.4"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                <p>{{ t('orders.emptyState') }}</p>
              </div>
            } @else {
              <div class="orders-list">
                @for (order of orders(); track order.id) {
                  <div class="order-card" (click)="openDetail(order)" role="button" tabindex="0" (keyup.enter)="openDetail(order)">
                    <div class="order-card-top">
                      <div class="order-meta">
                        <div class="order-number">#{{ order.orderNumber }}</div>
                        <div class="order-customer">{{ order.customerName }}</div>
                        <div class="order-date">{{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
                      </div>
                      <div class="order-right">
                        <div class="status-badge" [style.color]="statusColor(order.status)" [style.background]="statusBg(order.status)">
                          {{ t('orders.status.' + order.status) }}
                        </div>
                        <div class="order-total">{{ formatPrice(order.total) }}</div>
                      </div>
                    </div>

                    <div class="order-card-mid">
                      <span class="items-count">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                        {{ order.items.length }} {{ t('orders.itemsCount') }}
                      </span>
                      @if (order.isGift) {
                        <span class="gift-pill">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/></svg>
                          {{ t('orders.gift') }}
                          @if (order.giftRevokedAt) {
                            · <span class="gift-status-revoked">{{ t('orders.giftRevoked') }}</span>
                          } @else if (order.giftRedeemedAt) {
                            · <span class="gift-status-redeemed">{{ t('orders.giftRedeemed') }}</span>
                          } @else {
                            · <span class="gift-status-pending">{{ t('orders.giftPending') }}</span>
                          }
                        </span>
                      }
                      <span class="detail-hint">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        {{ t('orders.viewDetail') }}
                      </span>
                    </div>

                    <!-- Action bar -->
                    <div class="order-actions" (click)="$event.stopPropagation()">
                      <div class="status-quick">
                        @for (s of quickStatuses(order.status); track s) {
                          <button
                            class="action-btn"
                            [style.color]="statusColor(s)"
                            [style.border-color]="statusColor(s) + '44'"
                            (click)="updateStatus(order, s)"
                            [disabled]="updatingId() === order.id"
                          >
                            {{ t('orders.status.' + s) }}
                          </button>
                        }
                      </div>
                      @if (order.isGift && !order.giftRevokedAt && !order.giftRedeemedAt) {
                        <button
                          class="revoke-btn"
                          (click)="revokeGift(order)"
                          [disabled]="updatingId() === order.id"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                          {{ t('orders.revokeQr') }}
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Detail drawer backdrop -->
              @if (detailOrder()) {
                <div class="detail-backdrop" (click)="closeDetail()"></div>
                <aside class="detail-drawer">
                  <div class="detail-header">
                    <div class="detail-header-left">
                      <div class="status-badge" [style.color]="statusColor(detailOrder()!.status)" [style.background]="statusBg(detailOrder()!.status)">
                        {{ t('orders.status.' + detailOrder()!.status) }}
                      </div>
                      <span class="detail-order-num">#{{ detailOrder()!.orderNumber }}</span>
                    </div>
                    <button class="detail-close" (click)="closeDetail()">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>

                  <div class="detail-body">

                    <!-- Customer info -->
                    <div class="detail-section">
                      <div class="detail-section-title">{{ t('orders.detailCustomer') }}</div>
                      <div class="detail-info-grid">
                        <div class="detail-info-row">
                          <span class="di-label">{{ t('orders.detailName') }}</span>
                          <span class="di-value">{{ detailOrder()!.customerName }}</span>
                        </div>
                        @if (detailOrder()!.customerPhone) {
                          <div class="detail-info-row">
                            <span class="di-label">{{ t('orders.detailPhone') }}</span>
                            <a [href]="'tel:' + detailOrder()!.customerPhone" class="di-value di-link">{{ detailOrder()!.customerPhone }}</a>
                          </div>
                        }
                        @if (detailOrder()!.customerEmail) {
                          <div class="detail-info-row">
                            <span class="di-label">{{ t('orders.detailEmail') }}</span>
                            <a [href]="'mailto:' + detailOrder()!.customerEmail" class="di-value di-link">{{ detailOrder()!.customerEmail }}</a>
                          </div>
                        }
                        <div class="detail-info-row">
                          <span class="di-label">{{ t('orders.detailDate') }}</span>
                          <span class="di-value">{{ detailOrder()!.createdAt | date:'dd/MM/yyyy à HH:mm' }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Items -->
                    <div class="detail-section">
                      <div class="detail-section-title">{{ t('orders.detailItems') }}</div>
                      <div class="detail-items-list">
                        @for (item of detailOrder()!.items; track item.id) {
                          <div class="detail-item">
                            <div class="detail-item-left">
                              <span class="detail-item-qty">{{ item.quantity }}×</span>
                              <div>
                                <div class="detail-item-name">{{ item.menuItemName }}</div>
                                @if (item.specialInstructions) {
                                  <div class="detail-item-instr">{{ item.specialInstructions }}</div>
                                }
                              </div>
                            </div>
                            <span class="detail-item-price">{{ formatPrice(item.subtotal) }}</span>
                          </div>
                        }
                        <div class="detail-total-row">
                          <span>{{ t('orders.detailTotal') }}</span>
                          <strong>{{ formatPrice(detailOrder()!.total) }}</strong>
                        </div>
                      </div>
                    </div>

                    <!-- Notes -->
                    @if (detailOrder()!.notes) {
                      <div class="detail-section">
                        <div class="detail-section-title">{{ t('orders.detailNotes') }}</div>
                        <div class="detail-notes">{{ detailOrder()!.notes }}</div>
                      </div>
                    }

                    <!-- Gift info -->
                    @if (detailOrder()!.isGift) {
                      <div class="detail-section detail-gift-section">
                        <div class="detail-section-title gift-title">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/></svg>
                          {{ t('orders.detailGift') }}
                        </div>
                        @if (detailOrder()!.giftMessage) {
                          <div class="detail-gift-msg">"{{ detailOrder()!.giftMessage }}"</div>
                        }
                        @if (detailOrder()!.giftRevokedAt) {
                          <div class="detail-gift-status detail-gift-revoked">{{ t('orders.giftRevoked') }}</div>
                        } @else if (detailOrder()!.giftRedeemedAt) {
                          <div class="detail-gift-status detail-gift-redeemed">
                            ✅ {{ t('orders.giftRedeemed') }}
                            @if (detailOrder()!.giftRedeemedBy) {
                              <span class="di-sub">{{ t('orders.detailRedeemedBy') }} {{ detailOrder()!.giftRedeemedBy }}</span>
                            }
                          </div>
                        } @else {
                          <div class="detail-gift-status detail-gift-pending">⏳ {{ t('orders.giftPending') }}</div>
                        }
                        @if (!detailOrder()!.giftRevokedAt && !detailOrder()!.giftRedeemedAt) {
                          <button class="revoke-btn revoke-full" (click)="revokeGift(detailOrder()!); closeDetail()" [disabled]="updatingId() === detailOrder()!.id">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                            {{ t('orders.revokeQr') }}
                          </button>
                        }
                      </div>
                    }

                    <!-- Status actions -->
                    @if (quickStatuses(detailOrder()!.status).length > 0) {
                      <div class="detail-section">
                        <div class="detail-section-title">{{ t('orders.detailChangeStatus') }}</div>
                        <div class="detail-actions">
                          @for (s of quickStatuses(detailOrder()!.status); track s) {
                            <button
                              class="action-btn action-btn-full"
                              [style.color]="statusColor(s)"
                              [style.border-color]="statusColor(s) + '55'"
                              [style.background]="statusBg(s)"
                              (click)="updateStatusAndSync(detailOrder()!, s)"
                              [disabled]="updatingId() === detailOrder()!.id"
                            >
                              {{ t('orders.status.' + s) }}
                            </button>
                          }
                        </div>
                      </div>
                    }

                  </div>
                </aside>
              }

              <!-- Pagination -->
              @if (meta().lastPage > 1) {
                <div class="pagination">
                  <button class="page-btn" [disabled]="meta().currentPage <= 1" (click)="prevPage()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                    {{ t('orders.prevPage') }}
                  </button>
                  <span class="page-info">{{ meta().currentPage }} / {{ meta().lastPage }}</span>
                  <button class="page-btn" [disabled]="meta().currentPage >= meta().lastPage" (click)="nextPage()">
                    {{ t('orders.nextPage') }}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </div>
              }
            }
          }
        }
      </div>
    </ng-container>
  `,
  styles: [`
    :host { display: block; }

    .orders-page {
      padding: var(--space-6);
      max-width: 900px;
    }

    /* Locked banner */
    .locked-banner {
      display: flex;
      align-items: flex-start;
      gap: var(--space-6);
      background: linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%);
      border: 1.5px solid #DDD6FE;
      border-radius: var(--radius-md);
      padding: var(--space-8);
      margin-bottom: var(--space-6);
    }
    .locked-icon {
      width: 56px;
      height: 56px;
      background: white;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #7C3AED;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(124,58,237,.15);
    }
    .locked-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: #3B0764;
      margin-bottom: var(--space-2);
    }
    .locked-desc {
      font-size: .9375rem;
      color: #6D28D9;
      line-height: 1.6;
      margin-bottom: var(--space-4);
    }
    .locked-cta {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      background: #7C3AED;
      color: white;
      text-decoration: none;
      padding: var(--space-3) var(--space-5);
      border-radius: var(--radius-full);
      font-size: .9375rem;
      font-weight: 700;
      transition: background var(--t-fast), transform var(--t-fast);
    }
    .locked-cta:hover { background: #6D28D9; transform: translateY(-1px); }

    /* Page header */
    .page-header {
      margin-bottom: var(--space-6);
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 var(--space-1);
    }
    .page-sub {
      font-size: .9375rem;
      color: var(--text-secondary);
      margin: 0;
    }

    /* QR Scanner */
    .scanner-panel {
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-5);
      overflow: hidden;
    }
    .scanner-toggle {
      width: 100%;
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-5);
      background: none;
      border: none;
      cursor: pointer;
      font-size: .9375rem;
      font-weight: 600;
      color: var(--text-primary);
      font-family: var(--font-body);
      text-align: left;
    }
    .scanner-toggle:hover { background: var(--surface-2); }
    .chevron { margin-left: auto; transition: transform var(--t-fast); color: var(--text-secondary); }
    .chevron-open { transform: rotate(180deg); }

    .scanner-body {
      padding: 0 var(--space-5) var(--space-5);
      border-top: 1px solid var(--border);
      padding-top: var(--space-4);
    }
    .scanner-input-row {
      display: flex;
      gap: var(--space-3);
    }
    .scanner-input {
      flex: 1;
      padding: var(--space-3) var(--space-4);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      font-size: .9375rem;
      font-family: var(--font-body);
      color: var(--text-primary);
      outline: none;
    }
    .scanner-input:focus { border-color: var(--color-brand); }
    .scanner-btn {
      padding: var(--space-3) var(--space-5);
      background: var(--color-brand);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-size: .875rem;
      font-weight: 600;
      font-family: var(--font-body);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .scanner-btn:disabled { opacity: .6; cursor: not-allowed; }
    .scan-error {
      margin-top: var(--space-3);
      padding: var(--space-3) var(--space-4);
      background: #FEF2F2;
      color: #DC2626;
      border-radius: var(--radius-md);
      font-size: .875rem;
    }
    .scanned-card {
      margin-top: var(--space-4);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: var(--space-4);
      background: white;
    }
    .scanned-card-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-2);
    }
    .scanned-number { font-weight: 700; color: var(--text-primary); }
    .scanned-customer { font-size: .875rem; color: var(--text-secondary); }
    .scanned-total { font-size: .9375rem; font-weight: 600; color: var(--text-primary); }
    .scanned-gift-info {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: .8125rem;
      margin-top: var(--space-2);
      color: var(--text-secondary);
    }

    /* Filter bar */
    .filter-bar {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      margin-bottom: var(--space-5);
      flex-wrap: wrap;
    }
    .filter-tabs {
      display: flex;
      gap: 2px;
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 3px;
    }
    .tab {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      border: none;
      background: none;
      border-radius: calc(var(--radius-md) - 2px);
      font-size: .875rem;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
      font-family: var(--font-body);
      transition: color var(--t-fast), background var(--t-fast);
    }
    .tab:hover { color: var(--text-primary); }
    .tab-active { background: white; color: var(--text-primary); box-shadow: 0 1px 3px rgba(0,0,0,.1); }

    .search-wrap {
      position: relative;
      flex: 1;
      min-width: 200px;
    }
    .search-icon {
      position: absolute;
      left: var(--space-3);
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-secondary);
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      padding: var(--space-3) var(--space-3) var(--space-3) calc(var(--space-3) + 23px);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      font-size: .9375rem;
      font-family: var(--font-body);
      color: var(--text-primary);
      outline: none;
      background: white;
    }
    .search-input:focus { border-color: var(--color-brand); }

    /* Skeletons */
    .skeleton-card {
      padding: var(--space-5) !important;
    }
    .skeleton {
      background: linear-gradient(90deg, var(--gray-100) 25%, var(--gray-50) 50%, var(--gray-100) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* Orders list */
    .orders-list { display: flex; flex-direction: column; gap: var(--space-3); }

    .order-card {
      background: white;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: var(--space-5);
      transition: box-shadow var(--t-fast);
    }
    .order-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,.07); }

    .order-card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-3);
      gap: var(--space-4);
    }
    .order-number { font-size: 1rem; font-weight: 700; color: var(--text-primary); }
    .order-customer { font-size: .875rem; color: var(--text-secondary); margin-top: 2px; }
    .order-date { font-size: .8125rem; color: var(--text-secondary); opacity: .7; margin-top: 2px; }
    .order-right { display: flex; flex-direction: column; align-items: flex-end; gap: var(--space-2); }
    .order-total { font-size: .9375rem; font-weight: 700; color: var(--text-primary); }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: var(--radius-full);
      font-size: .75rem;
      font-weight: 700;
      letter-spacing: .03em;
    }

    .order-card-mid {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
      flex-wrap: wrap;
    }
    .items-count {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: .8125rem;
      color: var(--text-secondary);
    }
    .gift-pill {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font-size: .8125rem;
      color: #7C3AED;
      background: #F5F3FF;
      border: 1px solid #DDD6FE;
      border-radius: var(--radius-full);
      padding: 2px 10px;
    }
    .gift-status-revoked { color: #EF4444; }
    .gift-status-redeemed { color: #10B981; }
    .gift-status-pending { color: #F59E0B; }

    /* Actions */
    .order-actions {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex-wrap: wrap;
      padding-top: var(--space-3);
      border-top: 1px solid var(--border);
    }
    .status-quick { display: flex; gap: var(--space-2); flex-wrap: wrap; }
    .action-btn {
      padding: var(--space-2) var(--space-3);
      border: 1.5px solid;
      border-radius: var(--radius-md);
      background: white;
      font-size: .8125rem;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font-body);
      transition: opacity var(--t-fast), transform var(--t-fast);
    }
    .action-btn:hover:not(:disabled) { opacity: .8; transform: translateY(-1px); }
    .action-btn:disabled { opacity: .5; cursor: not-allowed; }

    .revoke-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      border: 1.5px solid #FECACA;
      border-radius: var(--radius-md);
      background: #FFF5F5;
      color: #EF4444;
      font-size: .8125rem;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font-body);
      margin-left: auto;
      transition: background var(--t-fast);
    }
    .revoke-btn:hover:not(:disabled) { background: #FEE2E2; }
    .revoke-btn:disabled { opacity: .5; cursor: not-allowed; }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: var(--space-10) 0;
      color: var(--text-secondary);
    }
    .empty-state p { margin-top: var(--space-4); font-size: .9375rem; }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-4);
      margin-top: var(--space-6);
    }
    .page-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: white;
      font-size: .875rem;
      font-weight: 600;
      color: var(--text-primary);
      cursor: pointer;
      font-family: var(--font-body);
    }
    .page-btn:disabled { opacity: .4; cursor: not-allowed; }
    .page-btn:hover:not(:disabled) { background: var(--surface-1); }
    .page-info { font-size: .875rem; color: var(--text-secondary); }

    /* Spinner */
    .spinner-sm {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,.4);
      border-top-color: white;
      border-radius: 50%;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Card clickable */
    .order-card { cursor: pointer; }
    .order-card:focus-visible { outline: 2px solid var(--color-brand); outline-offset: 2px; }
    .detail-hint {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: .75rem; color: var(--text-muted);
      margin-left: auto;
      opacity: 0;
      transition: opacity var(--t-fast);
    }
    .order-card:hover .detail-hint { opacity: 1; }

    /* Detail drawer */
    .detail-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.4);
      z-index: 200;
    }
    .detail-drawer {
      position: fixed;
      top: 0; right: 0; bottom: 0;
      width: min(440px, 100vw);
      background: white;
      z-index: 201;
      display: flex; flex-direction: column;
      box-shadow: -4px 0 32px rgba(0,0,0,.14);
      animation: slideIn .22s cubic-bezier(.16,1,.3,1);
    }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }

    .detail-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-4) var(--space-5);
      border-bottom: 1px solid var(--border);
      background: var(--gray-50);
      gap: var(--space-3);
      flex-shrink: 0;
    }
    .detail-header-left { display: flex; align-items: center; gap: var(--space-3); min-width: 0; }
    .detail-order-num { font-size: .9375rem; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .detail-close {
      width: 32px; height: 32px; flex-shrink: 0;
      border: none; background: var(--gray-200); border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: var(--text-muted);
      transition: background var(--t-fast), color var(--t-fast);
    }
    .detail-close:hover { background: var(--gray-300); color: var(--text-primary); }

    .detail-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0; }

    .detail-section {
      padding: var(--space-5);
      border-bottom: 1px solid var(--border);
    }
    .detail-section:last-child { border-bottom: none; }
    .detail-section-title {
      font-size: .75rem; font-weight: 700; letter-spacing: .07em;
      text-transform: uppercase; color: var(--text-muted);
      margin-bottom: var(--space-4);
      display: flex; align-items: center; gap: var(--space-2);
    }

    .detail-info-grid { display: flex; flex-direction: column; gap: var(--space-3); }
    .detail-info-row { display: flex; align-items: baseline; gap: var(--space-3); }
    .di-label { font-size: .8125rem; color: var(--text-muted); min-width: 90px; flex-shrink: 0; }
    .di-value { font-size: .9rem; color: var(--text-primary); font-weight: 500; }
    .di-link { color: var(--color-brand); text-decoration: none; }
    .di-link:hover { text-decoration: underline; }
    .di-sub { display: block; font-size: .8125rem; color: var(--text-muted); margin-top: 2px; }

    .detail-items-list { display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; }
    .detail-item {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: var(--space-3) var(--space-4); gap: var(--space-3);
      border-bottom: 1px solid var(--gray-100);
      background: white;
    }
    .detail-item:last-of-type { border-bottom: none; }
    .detail-item-left { display: flex; align-items: flex-start; gap: var(--space-3); flex: 1; min-width: 0; }
    .detail-item-qty {
      min-width: 26px; height: 22px;
      background: var(--gray-100); border-radius: 5px;
      font-size: .75rem; font-weight: 700; color: var(--text-primary);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .detail-item-name { font-size: .9rem; font-weight: 600; color: var(--text-primary); }
    .detail-item-instr { font-size: .8125rem; color: var(--text-muted); margin-top: 2px; font-style: italic; }
    .detail-item-price { font-size: .9rem; font-weight: 600; color: var(--text-secondary); white-space: nowrap; }
    .detail-total-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-3) var(--space-4);
      background: var(--gray-50);
      border-top: 1.5px solid var(--border);
      font-size: .9375rem; color: var(--text-secondary);
    }
    .detail-total-row strong { font-size: 1.0625rem; font-weight: 800; color: var(--text-primary); }

    .detail-notes {
      font-size: .9rem; color: var(--text-secondary);
      background: var(--gray-50); border-radius: var(--radius-md);
      padding: var(--space-3) var(--space-4);
      line-height: 1.6;
    }

    .detail-gift-section { background: #FFFBEB; }
    .gift-title { color: #92400E; }
    .detail-gift-msg {
      font-size: .9375rem; color: #78350F;
      font-style: italic; line-height: 1.6;
      margin-bottom: var(--space-3);
    }
    .detail-gift-status {
      font-size: .875rem; font-weight: 600;
      display: flex; flex-direction: column; gap: 2px;
    }
    .detail-gift-revoked { color: #EF4444; }
    .detail-gift-redeemed { color: #10B981; }
    .detail-gift-pending { color: #F59E0B; }

    .detail-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .action-btn-full { flex: 1; justify-content: center; font-size: .875rem; padding: var(--space-3) var(--space-4); }
    .revoke-full { width: 100%; margin-top: var(--space-3); justify-content: center; }
  `],
})
export class OrdersComponent implements OnInit {
  private readonly orderService = inject(OrderService)
  private readonly authService = inject(AuthService)

  readonly loading = signal(true)
  readonly orders = signal<Order[]>([])
  readonly meta = signal({ total: 0, perPage: 20, currentPage: 1, lastPage: 1 })
  readonly updatingId = signal<number | null>(null)

  readonly scannerOpen = signal(false)
  readonly scanning = signal(false)
  readonly scannedOrder = signal<Order | null>(null)
  readonly scanError = signal('')
  readonly detailOrder = signal<Order | null>(null)

  readonly activeTab = signal<'all' | 'pending' | 'confirmed' | 'gift'>('all')

  searchQuery = ''
  scanTokenValue = ''

  private searchTimer: ReturnType<typeof setTimeout> | null = null

  readonly hasAccess = computed(() => {
    const r = this.authService.restaurant()
    if (!r) return false
    return !!(r as any)?.plan?.features?.['orders_and_reservations'] || (r as any)?.plan?.slug === 'enterprise'
  })

  statusColor(status: OrderStatus): string { return STATUS_COLORS[status] ?? '#6B7280' }
  statusBg(status: OrderStatus): string { return STATUS_BG[status] ?? '#F9FAFB' }

  formatPrice(euros: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(euros)
  }

  quickStatuses(current: OrderStatus): OrderStatus[] {
    const map: Partial<Record<OrderStatus, OrderStatus[]>> = {
      pending:   ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready'],
      ready:     ['delivered'],
    }
    return map[current] ?? []
  }

  ngOnInit(): void {
    this.loadOrders()
  }

  setTab(tab: 'all' | 'pending' | 'confirmed' | 'gift'): void {
    this.activeTab.set(tab)
    this.meta.update(m => ({ ...m, currentPage: 1 }))
    this.loadOrders()
  }

  onSearch(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer)
    this.searchTimer = setTimeout(() => {
      this.meta.update(m => ({ ...m, currentPage: 1 }))
      this.loadOrders()
    }, 350)
  }

  loadOrders(): void {
    this.loading.set(true)
    const tab = this.activeTab()
    const params: Record<string, any> = { page: this.meta().currentPage }
    if (tab === 'gift') params['isGift'] = true
    else if (tab !== 'all') params['status'] = tab
    if (this.searchQuery.trim()) params['search'] = this.searchQuery.trim()

    this.orderService.getAdminOrders(params).subscribe({
      next: (res) => {
        this.orders.set(res.data)
        this.meta.set(res.meta)
        this.loading.set(false)
      },
      error: () => this.loading.set(false),
    })
  }

  prevPage(): void {
    this.meta.update(m => ({ ...m, currentPage: m.currentPage - 1 }))
    this.loadOrders()
  }

  nextPage(): void {
    this.meta.update(m => ({ ...m, currentPage: m.currentPage + 1 }))
    this.loadOrders()
  }

  openDetail(order: Order): void { this.detailOrder.set(order) }
  closeDetail(): void { this.detailOrder.set(null) }

  updateStatusAndSync(order: Order, status: OrderStatus): void {
    this.updateStatus(order, status)
    // update detail panel live
    this.detailOrder.update(o => o ? { ...o, status } : null)
  }

  updateStatus(order: Order, status: OrderStatus): void {
    this.updatingId.set(order.id)
    this.orderService.updateOrderStatus(order.id, status).subscribe({
      next: (updated) => {
        this.orders.update(list => list.map(o => o.id === updated.id ? updated : o))
        this.updatingId.set(null)
      },
      error: () => this.updatingId.set(null),
    })
  }

  revokeGift(order: Order): void {
    this.updatingId.set(order.id)
    this.orderService.revokeGift(order.id).subscribe({
      next: (updated) => {
        this.orders.update(list => list.map(o => o.id === updated.id ? updated : o))
        this.updatingId.set(null)
      },
      error: () => this.updatingId.set(null),
    })
  }

  runScan(): void {
    if (!this.scanTokenValue.trim()) return
    this.scanning.set(true)
    this.scanError.set('')
    this.scannedOrder.set(null)

    this.orderService.scanToken(this.scanTokenValue.trim()).subscribe({
      next: (order) => {
        this.scannedOrder.set(order)
        this.scanning.set(false)
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Token introuvable.'
        this.scanError.set(msg)
        this.scanning.set(false)
      },
    })
  }
}
