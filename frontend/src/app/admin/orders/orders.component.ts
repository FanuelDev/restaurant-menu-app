import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { TranslocoModule } from '@jsverse/transloco'
import { OrderService } from '../../shared/services/order.service'
import { AuthService } from '../../shared/services/auth.service'
import { RestaurantService } from '../../shared/services/restaurant.service'
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
  templateUrl: './orders.component.html',
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
  private readonly restaurantService = inject(RestaurantService)

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
    const plan = (r as any)?.plan
    return !!(plan?.features?.['orders_and_reservations']) || plan?.slug === 'pro' || plan?.slug === 'enterprise'
  })

  statusColor(status: OrderStatus): string { return STATUS_COLORS[status] ?? '#6B7280' }
  statusBg(status: OrderStatus): string { return STATUS_BG[status] ?? '#F9FAFB' }

  formatPrice(amount: number): string {
    const currency = this.restaurantService.restaurant()?.currency ?? 'XOF'
    try {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount)
    } catch {
      return `${amount} ${currency}`
    }
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
